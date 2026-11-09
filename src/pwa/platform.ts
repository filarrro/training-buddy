/** Platform detection for install / update UX (FR36, FR38). Pure functions, safe in tests. */

export interface PlatformEnv {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  /** navigator.standalone (iOS) */
  standalone?: boolean;
  /** matchMedia('(display-mode: standalone|fullscreen|minimal-ui)') */
  displayModeStandalone?: boolean;
}

function readEnv(): PlatformEnv {
  if (typeof navigator === 'undefined') return { userAgent: '' };
  const mq = (q: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  return {
    userAgent: navigator.userAgent ?? '',
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navigator.standalone,
    displayModeStandalone:
      mq('(display-mode: standalone)') || mq('(display-mode: fullscreen)') || mq('(display-mode: minimal-ui)'),
  };
}

/** iPhone / iPod / iPad, including iPadOS which reports a desktop "Macintosh" UA but has touch. */
export function isIos(env: PlatformEnv = readEnv()): boolean {
  const ua = env.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  const macLike = /Macintosh/i.test(ua) || env.platform === 'MacIntel';
  return macLike && (env.maxTouchPoints ?? 0) > 1;
}

/** Running as an installed app (home screen / standalone window). */
export function isStandalone(env: PlatformEnv = readEnv()): boolean {
  return env.standalone === true || env.displayModeStandalone === true;
}

/** FR36: iOS browser tab (not launched from the home screen) — installing is possible and advisable. */
export function isIosBrowser(env: PlatformEnv = readEnv()): boolean {
  return isIos(env) && !isStandalone(env);
}
