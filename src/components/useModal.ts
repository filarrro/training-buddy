import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useBackGuard } from '../app/backGuard';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps a component mounted for `exitMs` after `open` turns false, so it can animate out. */
export function usePresence(open: boolean, exitMs = 220): { mounted: boolean; closing: boolean } {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setMounted(false), reduce ? 0 : exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);
  return { mounted: open || mounted, closing: !open && mounted };
}

/** Modal behaviour: initial focus, Esc to close, Tab trap, scroll lock, focus restore. */
export function useModal(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // System back (Android button / swipe) closes the modal instead of leaving the screen.
  useBackGuard(() => {
    onCloseRef.current();
    return true;
  }, open);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const initial =
      node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    initial?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, ref]);
}
