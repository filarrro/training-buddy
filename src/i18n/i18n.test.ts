import { describe, expect, it } from 'vitest';
import { DICTIONARIES, detectLang, translate } from './core';

describe('i18n', () => {
  it('detects language from navigator.language (FR39)', () => {
    expect(detectLang('pl-PL')).toBe('pl');
    expect(detectLang('pl')).toBe('pl');
    expect(detectLang('en-US')).toBe('en');
    expect(detectLang('de-DE')).toBe('en');
  });

  it('Polish plurals via Intl.PluralRules', () => {
    expect(translate('pl', 'common.count.sets', { count: 1 })).toBe('1 seria');
    expect(translate('pl', 'common.count.sets', { count: 2 })).toBe('2 serie');
    expect(translate('pl', 'common.count.sets', { count: 5 })).toBe('5 serii');
    expect(translate('pl', 'common.count.sets', { count: 22 })).toBe('22 serie');
    expect(translate('pl', 'common.count.reps', { count: 3 })).toBe('3 powtórzenia');
    expect(translate('pl', 'common.count.reps', { count: 5 })).toBe('5 powtórzeń');
    expect(translate('pl', 'common.count.rounds', { count: 5 })).toBe('5 rund');
    expect(translate('en', 'common.count.sets', { count: 1 })).toBe('1 set');
    expect(translate('en', 'common.count.sets', { count: 4 })).toBe('4 sets');
  });

  it('falls back to PL, then to the key', () => {
    expect(translate('en', 'common.missing.key')).toBe('common.missing.key');
    DICTIONARIES.pl['test.onlyPl'] = 'tylko PL';
    expect(translate('en', 'test.onlyPl')).toBe('tylko PL');
  });

  it('PL and EN common dictionaries cover the same keys (ignoring plural forms)', () => {
    const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
    const keys = (lang: 'pl' | 'en') =>
      new Set(Object.keys(DICTIONARIES[lang]).filter((k) => k.startsWith('common.')).map(base));
    expect([...keys('pl')].sort()).toEqual([...keys('en')].sort());
  });

  it('every key exists in both PL and EN (all namespaces, ignoring plural forms)', () => {
    const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
    const keys = (lang: 'pl' | 'en') =>
      new Set(Object.keys(DICTIONARIES[lang]).filter((k) => !k.startsWith('test.')).map(base));
    const pl = keys('pl');
    const en = keys('en');
    expect([...pl].filter((k) => !en.has(k)).sort()).toEqual([]);
    expect([...en].filter((k) => !pl.has(k)).sort()).toEqual([]);
  });
});
