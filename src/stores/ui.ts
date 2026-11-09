import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../data/db';
import { sanitizeFlags } from '../domain/validation';

export interface UiFlags {
  /** FR37: "don't lock the phone" hint already shown */
  lockHintSeen: boolean;
  /** FR36: iOS install screen already shown / dismissed */
  installScreenSeen: boolean;
}

const DEFAULT_FLAGS: UiFlags = { lockHintSeen: false, installScreenSeen: false };

export interface UiState extends UiFlags {
  markLockHintSeen: () => void;
  markInstallScreenSeen: () => void;
  setFlag: (flag: keyof UiFlags, value: boolean) => void;
}

/** Persisted under IndexedDB key "ui". */
export const useUi = create<UiState>()(
  persist(
    (set) => ({
      ...DEFAULT_FLAGS,
      markLockHintSeen: () => set({ lockHintSeen: true }),
      markInstallScreenSeen: () => set({ installScreenSeen: true }),
      setFlag: (flag, value) => set({ [flag]: value } as Partial<UiFlags>),
    }),
    persistOptions<UiState, UiFlags>('ui', {
      partialize: (s) => ({ lockHintSeen: s.lockHintSeen, installScreenSeen: s.installScreenSeen }),
      sanitize: (raw) => sanitizeFlags(raw, DEFAULT_FLAGS),
    }),
  ),
);
