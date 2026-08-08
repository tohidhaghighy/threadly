import { useEffect, useState } from "react";
import {
  detectMobilePlatform,
  getDeferredInstallPrompt,
  isStandaloneDisplay,
  promptPwaInstall,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(() => getDeferredInstallPrompt());
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    setPlatform(detectMobilePlatform());
    return subscribeInstallPrompt(setDeferred);
  }, []);

  return {
    canPrompt: !!deferred && !standalone,
    isInstalled: standalone,
    platform,
    install: promptPwaInstall,
  };
}
