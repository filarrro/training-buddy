import type { WorkoutItem } from './types';

/** The part of an item (or editor draft) that describes linking and rest. */
export type LinkFields = Pick<WorkoutItem, 'linkNext' | 'restSec'>;
import { normalizeLinks } from './validation';

/**
 * Removes items matching `drop` while keeping linked groups consistent:
 * when the removed item ended a group, the previous kept item becomes the new end
 * (link cleared, group rest carried over if it had none).
 */
export function removeItems<T extends LinkFields>(items: readonly T[], drop: (item: T, index: number) => boolean): T[] {
  const out: T[] = [];
  items.forEach((item, index) => {
    if (!drop(item, index)) {
      out.push(item);
      return;
    }
    const prev = out[out.length - 1];
    if (prev?.linkNext && !item.linkNext) {
      const { linkNext: _drop, ...rest } = prev;
      out[out.length - 1] = (
        rest.restSec === undefined && item.restSec !== undefined ? { ...rest, restSec: item.restSec } : rest
      ) as T;
    }
  });
  return normalizeLinks(out);
}

/** Group label for a linked block: 2 items = superset, 3+ = circuit. */
export function groupKind(size: number): 'superset' | 'circuit' | null {
  return size < 2 ? null : size === 2 ? 'superset' : 'circuit';
}
