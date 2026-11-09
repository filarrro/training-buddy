/**
 * Synchronous mirror of the theme choice in localStorage (key "tb-theme").
 *
 * Settings live in IndexedDB and load asynchronously; the inline script in index.html needs the
 * choice before the first paint so the app never flashes the wrong theme. This is the only value
 * kept outside IndexedDB, and IndexedDB stays the source of truth (the mirror is rewritten from it).
 */
import type { ThemeChoice } from '../domain/types';

export const THEME_MIRROR_KEY = 'tb-theme';

export function readThemeMirror(): ThemeChoice | null {
  try {
    const v = globalThis.localStorage?.getItem(THEME_MIRROR_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : null;
  } catch {
    return null;
  }
}

export function writeThemeMirror(choice: ThemeChoice): void {
  try {
    globalThis.localStorage?.setItem(THEME_MIRROR_KEY, choice);
  } catch {
    /* private mode / storage disabled: the app still works, only the first paint may use the system theme */
  }
}
