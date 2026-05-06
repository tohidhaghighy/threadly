import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, type AuthUser } from "./api";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function getStoredToken() {
  try {
    return localStorage.getItem("threadly_token");
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem("threadly_token");
    else localStorage.setItem("threadly_token", token);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api<AuthUser>("/api/auth/me", { auth: true });
      setUser(me);
    } catch {
      // token is invalid/expired
      setUser(null);
      setToken(null);
      storeToken(null);
    }
  };

  useEffect(() => {
    storeToken(token);
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isAdmin: user?.role === "admin",
      async login(email, password) {
        const res = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(res.token);
        setUser(res.user);
      },
      async register(name, email, password) {
        const res = await api<{ token: string; user: AuthUser }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setToken(res.token);
        setUser(res.user);
      },
      logout() {
        setUser(null);
        setToken(null);
        storeToken(null);
      },
      refreshMe,
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

