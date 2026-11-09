import { afterEach, describe, expect, it } from 'vitest';
import { useSettings } from '../stores/settings';
import { applyTheme, resolveTheme, setThemeChoice, THEME_COLOR, toggleTheme } from './theme';
import { readThemeMirror, THEME_MIRROR_KEY, writeThemeMirror } from './themeMirror';

afterEach(() => {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  localStorage.clear();
  useSettings.getState().setTheme('system');
});

describe('theme', () => {
  it('resolves the choice against the system preference', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
  });

  it('applies data-theme, color-scheme and a theme-color only for a fixed choice', () => {
    applyTheme('light', 'light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])')?.content).toBe(
      THEME_COLOR.light,
    );
    applyTheme('dark', 'system');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]:not([media])')).toBeNull();
  });

  it('mirrors only valid choices in localStorage', () => {
    writeThemeMirror('dark');
    expect(readThemeMirror()).toBe('dark');
    localStorage.setItem(THEME_MIRROR_KEY, 'neon');
    expect(readThemeMirror()).toBeNull();
  });

  it('setThemeChoice stores the choice and applies it at once; toggle flips what is shown', () => {
    setThemeChoice('light');
    expect(useSettings.getState().theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    toggleTheme();
    expect(useSettings.getState().theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
