import { create } from 'zustand';

export type ToastTone = 'neutral' | 'success' | 'danger' | 'work' | 'rest';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  /** 0 = sticky until dismissed */
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>) => number;
  dismiss: (id: number) => void;
}

let seq = 0;

/** Transient notifications rendered by <ToastHost/> in App. */
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, opts = {}) => {
    const id = ++seq;
    const item: ToastItem = { id, message, tone: opts.tone ?? 'neutral', durationMs: opts.durationMs ?? 2600, ...opts };
    set((s) => ({ toasts: [...s.toasts.slice(-2), item] }));
    if (item.durationMs > 0) setTimeout(() => get().dismiss(id), item.durationMs);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const showToast = (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>): number =>
  useToast.getState().show(message, opts);
