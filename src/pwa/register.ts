import { useNav } from '../app/nav';
import { usePwa } from './store';

const UPDATE_CHECK_MIN_INTERVAL_MS = 30 * 60 * 1000;
let registered = false;

/**
 * Registers the Service Worker (prompt mode) and the install/storage hooks. Called once from main.tsx.
 * Never reloads on its own: the reload happens only when the user taps "Refresh" (FR35, D44).
 */
export function registerPwa(): void {
  if (registered || typeof window === 'undefined') return;
  registered = true;

  listenForInstallPrompt();
  requestPersistentStorageOnFirstSession();

  if (!('serviceWorker' in navigator) || import.meta.env.DEV || import.meta.env.MODE === 'test') return;

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh: () => usePwa.setState({ needRefresh: true }),
        // The plugin reloads only for updates found by its own register() call; updates found later
        // (foreground checks, browser checks) are "external". We reload ourselves — see reloadAfterUpdate.
        onNeedReload: () => {},
        onRegisteredSW: (_url, registration) => {
          if (registration) scheduleUpdateChecks(registration);
        },
        onRegisterError: () => {
          /* offline cache unavailable (e.g. private mode) — the app still works online */
        },
      });
      usePwa.setState({
        applyUpdate: () => {
          reloadAfterUpdate();
          void updateSW(true);
        },
      });
    })
    .catch(() => {
      /* registration module failed to load — ignore, app works without SW */
    });
}

/** User tapped "Refresh": reload once the new SW takes control (fallback: reload after 3 s anyway). */
function reloadAfterUpdate(): void {
  let done = false;
  const reload = () => {
    if (done) return;
    done = true;
    window.location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
  window.setTimeout(reload, 3000);
}

/** Check for a new version when the app comes back to the foreground (throttled). */
function scheduleUpdateChecks(registration: ServiceWorkerRegistration): void {
  let lastCheck = Date.now();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    if (Date.now() - lastCheck < UPDATE_CHECK_MIN_INTERVAL_MS) return;
    lastCheck = Date.now();
    void registration.update().catch(() => {});
  });
}

function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep Chrome's mini-infobar away; we show our own subtle chip
    usePwa.setState({ installPrompt: e });
  });
  window.addEventListener('appinstalled', () => usePwa.setState({ installPrompt: null }));
}

/**
 * FR38: ask for persistent storage once per launch, when the first workout starts — a moment of clear
 * engagement (Chromium grants it silently for engaged/installed sites; Safari/Firefox decide themselves).
 */
function requestPersistentStorageOnFirstSession(): void {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage || typeof storage.persist !== 'function') return;
  const unsub = useNav.subscribe((s) => {
    const name = s.stack[s.stack.length - 1]?.screen.name;
    if (name !== 'session' && name !== 'lockHint') return;
    unsub();
    void (async () => {
      try {
        if (typeof storage.persisted === 'function' && (await storage.persisted())) return;
        await storage.persist();
      } catch {
        /* not critical */
      }
    })();
  });
}
