import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from './core';

/** Source of every app module (tests and the dictionaries themselves excluded). */
const modules = import.meta.glob<string>(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!./locales/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});
const source = Object.values(modules).join('\n');
/** Prefixes of keys built at run time: t(`common.mode.${mode}`). */
const dynamic = [...source.matchAll(/`([a-zA-Z]+\.[a-zA-Z.]*)\$\{/g)].map((m) => m[1]!);

describe('i18n dictionaries', () => {
  it('have no unused keys', () => {
    const base = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');
    const quoted = (k: string) => [`'${k}'`, `"${k}"`, `\`${k}\``].some((q) => source.includes(q));
    const unused = [...new Set(Object.keys(DICTIONARIES.pl).map(base))]
      .filter((k) => !k.startsWith('test.'))
      .filter((k) => !quoted(k) && !dynamic.some((p) => k.startsWith(p)));
    expect(unused).toEqual([]);
  });
});
