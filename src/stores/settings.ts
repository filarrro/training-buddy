import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../data/db';
import { sanitizeSettings } from '../domain/validation';
import type { Lang, Settings, ThemeChoice } from '../domain/types';
import { readThemeMirror } from '../app/themeMirror';
import { detectLang } from '../i18n/core';

export function defaultSettings(): Settings {
  return {
    lang: detectLang(),
    theme: readThemeMirror() ?? 'system',
    sound: true,
    countdownBeeps: true,
    vibration: true,
    keepScreenOn: true,
  };
}

export interface SettingsState extends Settings {
  setLang: (lang: Lang) => void;
  setTheme: (theme: ThemeChoice) => void;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const pickSettings = (s: Settings): Settings => ({
  lang: s.lang,
  theme: s.theme,
  sound: s.sound,
  countdownBeeps: s.countdownBeeps,
  vibration: s.vibration,
  keepScreenOn: s.keepScreenOn,
});

/** Persisted under IndexedDB key "settings". */
export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings(),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      update: (patch) => set(sanitizeSettings({ ...pickSettings(get()), ...patch }, pickSettings(get()))),
      reset: () => set(defaultSettings()),
    }),
    persistOptions<SettingsState, Settings>('settings', {
      partialize: pickSettings,
      sanitize: (raw) => sanitizeSettings(raw, defaultSettings()),
    }),
  ),
);
