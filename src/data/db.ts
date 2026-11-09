/**
 * Single IndexedDB database shared by the app and the Service Worker (D13, FR40):
 * DB "training-buddy", object store "kv". Keys: library, settings, ui (+ session, reminders later).
 *
 * Never throws: when IndexedDB is unavailable (private mode, blocked, timeout) everything keeps
 * working in memory and `useStorageStatus.getState().available` becomes false (banner, FR40 S).
 */
import { createStore, del, get, set } from 'idb-keyval';
import type { UseStore } from 'idb-keyval';
import { create } from 'zustand';
import type { PersistOptions, PersistStorage, StorageValue } from 'zustand/middleware';

export const DB_NAME = 'training-buddy';
export const STORE_NAME = 'kv';
const OPEN_TIMEOUT_MS = 2500;

export const useStorageStatus = create<{ available: boolean }>(() => ({ available: true }));

export function isStorageAvailable(): boolean {
  return useStorageStatus.getState().available;
}

function markUnavailable(reason?: unknown): void {
  if (useStorageStatus.getState().available) {
    console.warn('[db] IndexedDB unavailable, using in-memory storage', reason);
    useStorageStatus.setState({ available: false });
  }
}

const memory = new Map<string, unknown>();
let kvStore: UseStore | null = null;

function getKv(): UseStore | null {
  if (!isStorageAvailable()) return null;
  if (kvStore) return kvStore;
  try {
    if (typeof indexedDB === 'undefined') throw new Error('indexedDB missing');
    kvStore = createStore(DB_NAME, STORE_NAME);
    return kvStore;
  } catch (e) {
    markUnavailable(e);
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('IndexedDB timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/** Raw key-value access (values are structured-cloned objects, not JSON strings). */
export const kv = {
  async get<T>(key: string): Promise<T | undefined> {
    const store = getKv();
    if (!store) return memory.get(key) as T | undefined;
    try {
      const v = await withTimeout(get<T>(key, store), OPEN_TIMEOUT_MS);
      return v;
    } catch (e) {
      markUnavailable(e);
      return memory.get(key) as T | undefined;
    }
  },
  async set(key: string, value: unknown): Promise<void> {
    memory.set(key, value);
    const store = getKv();
    if (!store) return;
    try {
      await withTimeout(set(key, value, store), OPEN_TIMEOUT_MS);
    } catch (e) {
      markUnavailable(e);
    }
  },
  async del(key: string): Promise<void> {
    memory.delete(key);
    const store = getKv();
    if (!store) return;
    try {
      await withTimeout(del(key, store), OPEN_TIMEOUT_MS);
    } catch (e) {
      markUnavailable(e);
    }
  },
};

/** Zustand persist storage backed by `kv`. Never throws/rejects (a rejection would block hydration). */
export function idbPersistStorage<P>(): PersistStorage<P> {
  return {
    getItem: async (name) => {
      try {
        const v = await kv.get<StorageValue<P>>(name);
        return v ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        // strip non-cloneable values (functions) defensively
        await kv.set(name, JSON.parse(JSON.stringify(value)) as unknown);
      } catch (e) {
        console.warn('[db] persist setItem failed', e);
      }
    },
    removeItem: async (name) => {
      try {
        await kv.del(name);
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Standard persist options: IndexedDB storage, schema version 1, migrate stub, and a merge
 * step that validates persisted data (`sanitize`) so corrupt data falls back to defaults.
 */
export function persistOptions<S, P>(
  name: string,
  cfg: {
    partialize: (s: S) => P;
    sanitize: (raw: unknown) => P;
    version?: number;
    migrate?: (persisted: unknown, fromVersion: number) => unknown;
  },
): PersistOptions<S, P> {
  return {
    name,
    version: cfg.version ?? 1,
    storage: idbPersistStorage<P>(),
    partialize: cfg.partialize,
    migrate: (persisted, fromVersion) => {
      try {
        return (cfg.migrate ? cfg.migrate(persisted, fromVersion) : persisted) as P;
      } catch (e) {
        console.warn(`[db] migrate ${name} failed, using defaults`, e);
        return undefined as unknown as P;
      }
    },
    merge: (persisted, current) => {
      if (persisted === undefined || persisted === null) return current;
      try {
        return { ...current, ...cfg.sanitize(persisted) };
      } catch (e) {
        console.warn(`[db] invalid ${name} data, using defaults`, e);
        return current;
      }
    },
  };
}
