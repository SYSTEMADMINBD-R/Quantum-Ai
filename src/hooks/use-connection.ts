import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Check actual network connectivity by attempting to fetch a tiny resource.
 * navigator.onLine is unreliable on Android — it returns true even when
 * there's no actual internet connection.
 */
async function probeConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small same-origin resource. If the SW caches it,
    // this will succeed even offline — so also try a tiny uncached probe.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    // Use a cache-busting fetch to a tiny endpoint
    const resp = await fetch("/manifest.webmanifest?ping=" + Date.now(), {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

export function useConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  // Periodically probe connectivity when navigator.onLine says online
  useEffect(() => {
    const check = async () => {
      if (navigator.onLine) {
        const reachable = await probeConnectivity();
        if (!reachable && isOnlineRef.current) {
          setIsOnline(false);
          setWasOffline(true);
        } else if (reachable && !isOnlineRef.current) {
          setIsOnline(true);
        }
      }
    };

    // Probe every 10 seconds
    const interval = setInterval(check, 10000);
    // Initial probe after mount
    check();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      // When browser says online, verify with a real probe
      const reachable = await probeConnectivity();
      setIsOnline(reachable);
      if (!reachable) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dismissOfflineWarning = useCallback(() => {
    setWasOffline(false);
  }, []);

  return { isOnline, wasOffline, dismissOfflineWarning };
}
