/**
 * i18n bound to the settings store.
 *   const t = useT();  t('common.action.save'); t('common.count.sets', { count: 3 })
 * Outside React: t('...') reads the current language from the settings store.
 * Strings live in src/i18n/locales/{pl,en}/<namespace>.ts — key "<namespace>.<key>".
 */
import { useCallback, useEffect } from 'react';
import type { Lang } from '../domain/types';
import { useSettings } from '../stores/settings';
import { translate } from './core';
import type { TFunction, TParams } from './core';

export type { TFunction, TParams } from './core';
export { translate, makeT, detectLang, pluralCategory, LANGS } from './core';

export function currentLang(): Lang {
  return useSettings.getState().lang;
}

/** Non-reactive translate using the current language. */
export const t: TFunction = (key, params) => translate(currentLang(), key, params);

/** Plural helper: plural('common.count.sets', 5) → "5 serii". */
export function plural(key: string, count: number, params?: TParams): string {
  return translate(currentLang(), key, { ...params, count });
}

export function useLang(): Lang {
  return useSettings((s) => s.lang);
}

/** Reactive translate function; re-renders on language change (no reload, FR39). */
export function useT(): TFunction {
  const lang = useLang();
  return useCallback<TFunction>((key, params) => translate(lang, key, params), [lang]);
}

/** Keeps <html lang> in sync with the setting. Mounted once in App. */
export function useDocumentLang(): void {
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}
