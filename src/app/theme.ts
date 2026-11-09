/**
 * Colour theme: resolves the user's choice (system / light / dark) against prefers-color-scheme
 * and applies it as <html data-theme="light|dark">. CSS only knows the resolved value.
 * The same logic runs inline in index.html before the first paint (keep both in sync).
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { ResolvedTheme, ThemeChoice } from '../domain/types';
import { useSettings } from '../stores/settings';
import { writeThemeMirror } from './themeMirror';

/** Browser chrome colour per theme (same as --c-bg). */
export const THEME_COLOR: Readonly<Record<ResolvedTheme, string>> = { dark: '#0B0F17', light: '#F5F7FB' };

const LIGHT_QUERY = '(prefers-color-scheme: light)';

export function resolveTheme(choice: ThemeChoice, systemPrefersLight: boolean): ResolvedTheme {
  if (choice === 'light' || choice === 'dark') return choice;
  return systemPrefersLight ? 'light' : 'dark';
}

function lightQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(LIGHT_QUERY) : null;
}

export function systemPrefersLight(): boolean {
  return lightQuery()?.matches ?? false;
}

/** Sets data-theme, color-scheme and the browser theme-color for the resolved theme. */
export function applyTheme(theme: ResolvedTheme, choice: ThemeChoice): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  // A fixed choice overrides the media-specific theme-color tags with one tag without media.
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
  if (choice === 'system') {
    meta?.remove();
  } else {
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = THEME_COLOR[theme];
  }
}

function subscribeSystem(onChange: () => void): () => void {
  const q = lightQuery();
  if (!q) return () => {};
  q.addEventListener('change', onChange);
  return () => q.removeEventListener('change', onChange);
}

/** Current system preference, re-rendering when it changes. */
export function useSystemPrefersLight(): boolean {
  return useSyncExternalStore(subscribeSystem, systemPrefersLight, () => false);
}

/** Resolved theme for components that need it in JS (e.g. category text colours). */
export function useResolvedTheme(): ResolvedTheme {
  const choice = useSettings((s) => s.theme);
  return resolveTheme(choice, useSystemPrefersLight());
}

/** Keeps <html data-theme> in sync with the setting and the system; mounted once in App. */
export function useThemeEffect(): void {
  const choice = useSettings((s) => s.theme);
  const theme = resolveTheme(choice, useSystemPrefersLight());
  useEffect(() => {
    applyTheme(theme, choice);
    writeThemeMirror(choice);
  }, [theme, choice]);
}

type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => unknown };

/** Change the theme choice; cross-fades the whole page where the View Transitions API exists. */
export function setThemeChoice(choice: ThemeChoice): void {
  const apply = () => {
    useSettings.getState().setTheme(choice);
    // Apply synchronously so the transition snapshot shows the new theme.
    applyTheme(resolveTheme(choice, systemPrefersLight()), choice);
  };
  const doc = document as ViewTransitionDoc;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (doc.startViewTransition && !reduced) doc.startViewTransition(apply);
  else apply();
}

/** Quick toggle: switch to the opposite of what is shown now (an explicit choice). */
export function toggleTheme(): void {
  const shown = resolveTheme(useSettings.getState().theme, systemPrefersLight());
  setThemeChoice(shown === 'dark' ? 'light' : 'dark');
}
