/**
 * Screen Wake Lock during the session (FR32, D50). Re-acquired when the page becomes visible
 * again (the browser releases it when hidden). Silent no-op when the API is missing (EC9).
 */
import { useEffect } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}
interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

function api(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null;
  const wl = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
  return wl && typeof wl.request === 'function' ? wl : null;
}

export function isWakeLockSupported(): boolean {
  return api() !== null;
}

/** Hold a screen wake lock while `active` is true. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wl = api();
    if (!active || !wl) return;
    let sentinel: WakeLockSentinelLike | null = null;
    let disposed = false;

    const acquire = async () => {
      if (disposed || document.visibilityState !== 'visible') return;
      if (sentinel && !sentinel.released) return;
      try {
        const s = await wl.request('screen');
        if (disposed) void s.release().catch(() => {});
        else sentinel = s;
      } catch {
        /* denied (battery saver, not visible…) — the app works without it */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
