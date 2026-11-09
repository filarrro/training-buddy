import { useEffect, useState } from 'react';
import { useLibrary } from './library';
import { useSettings } from './settings';
import { useUi } from './ui';

/** All persisted stores. Add new persisted stores here so the splash waits for them. */
const PERSISTED = [useLibrary, useSettings, useUi] as const;

export function allHydrated(): boolean {
  return PERSISTED.every((s) => s.persist.hasHydrated());
}

/** Resolves when every persisted store has hydrated (or after `timeoutMs` as a safety net). */
export function waitForHydration(timeoutMs = 4000): Promise<void> {
  if (allHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubs: Array<() => void> = [];
    const done = () => {
      unsubs.forEach((u) => u());
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    PERSISTED.forEach((s) =>
      unsubs.push(
        s.persist.onFinishHydration(() => {
          if (allHydrated()) done();
        }),
      ),
    );
    if (allHydrated()) done();
  });
}

/** React hook: true once all persisted stores are hydrated. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(allHydrated);
  useEffect(() => {
    if (ready) return;
    let alive = true;
    void waitForHydration().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [ready]);
  return ready;
}
