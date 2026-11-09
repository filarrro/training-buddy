import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Re-trigger the shared `.shake` animation on an element (invalid submit feedback). */
export function shake(el: Element | null | undefined): void {
  if (!el || prefersReducedMotion()) return;
  el.classList.remove('shake');
  void (el as HTMLElement).offsetWidth; // restart the animation
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

/**
 * FLIP reorder animation: children of `container` with `data-flip` animate from their previous
 * position to the new one whenever `deps` change (↑/↓ moves, removals). No-op under reduced motion.
 */
export function useFlip(container: RefObject<HTMLElement | null>, deps: readonly unknown[]): void {
  const prev = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-flip]'));
    const next = new Map<string, number>();
    const reduce = prefersReducedMotion();
    for (const node of nodes) {
      const key = node.dataset.flip!;
      const top = node.offsetTop;
      next.set(key, top);
      const before = prev.current.get(key);
      if (reduce || before === undefined || before === top || typeof node.animate !== 'function') continue;
      node.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'translateY(0)' }], {
        duration: 320,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      });
    }
    prev.current = next;
  }, deps);
}
