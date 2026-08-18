import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, type ApiError, type AuthUser } from "./api";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  /** False until client has finished reading localStorage / loading /me */
  ready: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "threadly_token";

function getStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

function isUnauthorized(err: unknown): boolean {
  const status = (err as ApiError | undefined)?.status;
  return status === 401 || status === 403;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const bootstrapped = useRef(false);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    storeToken(null);
  }, []);

  const refreshMe = useCallback(async (overrideToken?: string | null) => {
    const activeToken = overrideToken === undefined ? tokenRef.current : overrideToken;
    if (!activeToken) {
      setUser(null);
      return;
    }
    try {
      const me = await api<AuthUser>("/api/auth/me", { auth: true, token: activeToken });
      // Ignore stale responses if user logged out / logged in again
      if (tokenRef.current !== activeToken) return;
      setUser(me);
    } catch (err) {
      if (tokenRef.current !== activeToken) return;
      // Only wipe session on hard auth failures — network/proxy errors must not log the user out.
      if (isUnauthorized(err)) {
        clearSession();
      }
    }
  }, [clearSession]);

  // Client-only bootstrap: restore token from localStorage once (never write null on first paint).
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const stored = getStoredToken();
    if (!stored) {
      setReady(true);
      return;
    }

    tokenRef.current = stored;
    setToken(stored);
    void (async () => {
      await refreshMe(stored);
      setReady(true);
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeToken(res.token);
    tokenRef.current = res.token;
    setToken(res.token);
    setUser(res.user);
    setReady(true);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    storeToken(res.token);
    tokenRef.current = res.token;
    setToken(res.token);
    setUser(res.user);
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setReady(true);
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      ready,
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshMe: () => refreshMe(),
    }),
    [token, user, ready, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
