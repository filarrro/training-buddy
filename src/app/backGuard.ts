/**
 * System/browser "back" interceptors (LIFO). The history bridge (app/history.ts) asks the most
 * recently registered guard first; a guard returns true when it handled the back press (e.g. it
 * closed a sheet or opened a "discard changes?" dialog), so no navigation happens.
 * Dependency-free so components can use it without importing the nav store.
 */
import { useEffect, useRef } from 'react';

type Guard = () => boolean;

const guards: Guard[] = [];
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function pushBackGuard(guard: Guard): () => void {
  guards.push(guard);
  notify();
  return () => {
    const i = guards.lastIndexOf(guard);
    if (i >= 0) guards.splice(i, 1);
    notify();
  };
}

/** Run guards from the newest; true = the back press was consumed. */
export function runBackGuards(): boolean {
  for (let i = guards.length - 1; i >= 0; i--) if (guards[i]!()) return true;
  return false;
}

export const hasBackGuards = (): boolean => guards.length > 0;

export function subscribeBackGuards(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Registers `guard` while `active` (latest closure is always used). */
export function useBackGuard(guard: Guard, active = true): void {
  const ref = useRef(guard);
  ref.current = guard;
  useEffect(() => {
    if (!active) return;
    return pushBackGuard(() => ref.current());
  }, [active]);
}
