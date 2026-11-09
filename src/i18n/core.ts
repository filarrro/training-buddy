/**
 * Framework-free i18n core: dictionaries, plural rules, interpolation.
 * Keys are "<namespace>.<key>", e.g. t('common.action.save'), t('session.done').
 */
import type { Lang } from '../domain/types';

import plCommon from './locales/pl/common';
import plStart from './locales/pl/start';
import plPreview from './locales/pl/preview';
import plSession from './locales/pl/session';
import plConfig from './locales/pl/config';
import plSettings from './locales/pl/settings';
import plPwa from './locales/pl/pwa';
import enCommon from './locales/en/common';
import enStart from './locales/en/start';
import enPreview from './locales/en/preview';
import enSession from './locales/en/session';
import enConfig from './locales/en/config';
import enSettings from './locales/en/settings';
import enPwa from './locales/en/pwa';

export type TParams = Record<string, string | number>;
/** Translate function. Pass {count} to select a plural form (key_one/_few/_many/_other). */
export type TFunction = (key: string, params?: TParams) => string;

type Dict = Record<string, string>;

function merge(namespaces: Record<string, Dict>): Dict {
  const out: Dict = {};
  for (const [ns, dict] of Object.entries(namespaces)) {
    for (const [k, v] of Object.entries(dict)) out[`${ns}.${k}`] = v;
  }
  return out;
}

export const DICTIONARIES: Record<Lang, Dict> = {
  pl: merge({
    common: plCommon,
    start: plStart,
    preview: plPreview,
    session: plSession,
    config: plConfig,
    settings: plSettings,
    pwa: plPwa,
  }),
  en: merge({
    common: enCommon,
    start: enStart,
    preview: enPreview,
    session: enSession,
    config: enConfig,
    settings: enSettings,
    pwa: enPwa,
  }),
};

export const LANGS: readonly Lang[] = ['pl', 'en'];

/** Default language from navigator.language: pl* → pl, otherwise en (FR39). */
export function detectLang(navLang?: string): Lang {
  const l = navLang ?? (typeof navigator !== 'undefined' ? navigator.language : 'pl');
  return l?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

const pluralRulesCache = new Map<Lang, Intl.PluralRules>();
export function pluralCategory(lang: Lang, count: number): Intl.LDMLPluralRule {
  let pr = pluralRulesCache.get(lang);
  if (!pr) {
    pr = new Intl.PluralRules(lang);
    pluralRulesCache.set(lang, pr);
  }
  return pr.select(count);
}

function lookup(dict: Dict, key: string, lang: Lang, params?: TParams): string | undefined {
  const count = params?.count;
  if (typeof count === 'number') {
    const cat = pluralCategory(lang, count);
    return dict[`${key}_${cat}`] ?? dict[`${key}_other`] ?? dict[key];
  }
  return dict[key];
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    params[name] !== undefined ? String(params[name]) : m,
  );
}

/** Missing key falls back to PL, then to the key itself. */
export function translate(lang: Lang, key: string, params?: TParams): string {
  const hit = lookup(DICTIONARIES[lang], key, lang, params) ?? lookup(DICTIONARIES.pl, key, 'pl', params);
  return interpolate(hit ?? key, params);
}

export function hasKey(lang: Lang, key: string): boolean {
  const d = DICTIONARIES[lang];
  return key in d || `${key}_other` in d;
}

export function makeT(lang: Lang): TFunction {
  return (key, params) => translate(lang, key, params);
}
