/// <reference lib="webworker" />
/**
 * Service Worker (vite-plugin-pwa, strategy injectManifest).
 * - precaches the whole build (HTML, JS, CSS, icons, sounds, translations) → fully offline (FR34);
 * - SPA navigation fallback to index.html (works when launched offline);
 * - update flow "prompt": a new SW waits until the app sends SKIP_WAITING (user tapped "Refresh")
 *   or until every app window is closed — then it activates on the next cold start (FR35, D44).
 */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import type { PrecacheEntry } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> };

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Every in-scope navigation (start_url, reloads, deep paths) is served by the precached shell.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

self.addEventListener('message', (event) => {
  if (event.data && (event.data as { type?: string }).type === 'SKIP_WAITING') void self.skipWaiting();
});

// On the very first install there is no old version: take control of the open page right away so
// it works offline without a reload. Updates still wait for SKIP_WAITING (see above).
clientsClaim();

/*
 * Extension point (T11 — reminders, Android best effort, D7). Not implemented in the MVP:
 *
 * self.addEventListener('periodicsync', (event) => {
 *   if (event.tag === 'tb-reminder') event.waitUntil(showDueReminder());
 * });
 * self.addEventListener('notificationclick', (event) => {
 *   event.notification.close();
 *   event.waitUntil(focusOrOpenApp());
 * });
 */
