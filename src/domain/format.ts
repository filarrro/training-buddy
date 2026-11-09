import type { TFunction } from '../i18n/core';
import { CATEGORIES } from './builtins';
import type { Category, Exercise, Side, Target, Workout } from './types';

/** Display name: user-entered name wins, then translated built-in name. */
export function exerciseName(ex: Pick<Exercise, 'name' | 'nameKey' | 'id'>, t: TFunction): string {
  if (ex.name) return ex.name;
  return ex.nameKey ? t(ex.nameKey) : ex.id;
}

/** Display name: user-changed name wins (BR11), then translated built-in name. */
export function workoutName(w: Pick<Workout, 'name' | 'nameKey' | 'id'>, t: TFunction): string {
  if (w.name) return w.name;
  return w.nameKey ? t(w.nameKey) : w.id;
}

/** "5–7" or "10" when min = max. */
export function formatRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

export interface TargetFormatOptions {
  /** append "per leg" / "per side" */
  unilateral?: boolean;
  /** decides "leg" / "arm" / "side" (legs/posterior → leg, arm categories → arm) */
  category?: Category;
}

export function sideUnit(category: Category | undefined): 'leg' | 'side' | 'arm' {
  return category ? CATEGORIES[category].sideUnit : 'side';
}

/** "5–7 powt.", "45 s", "6–8 powt. na nogę". */
export function formatTarget(target: Target, t: TFunction, opts: TargetFormatOptions = {}): string {
  const base =
    target.type === 'reps'
      ? // count selects the plural form (EN "1 rep" / "5–7 reps"); the range is what is shown
        t('common.target.reps', { range: formatRange(target.min, target.max), count: target.max })
      : t('common.target.time', { sec: target.targetSec });
  if (!opts.unilateral) return base;
  const unit = sideUnit(opts.category);
  const per = t(unit === 'leg' ? 'common.target.perLeg' : unit === 'arm' ? 'common.target.perArm' : 'common.target.perSide');
  return `${base} ${per}`;
}

/** "4 × 5–7 powt.", "3 × 45 s", "3 × 6–8 powt. na nogę" (FR7). */
export function formatSetsTarget(
  sets: number,
  target: Target,
  t: TFunction,
  opts: TargetFormatOptions = {},
): string {
  return t('common.target.setsTimes', { sets, target: formatTarget(target, t, opts) });
}

/** Hint for time targets: "zakres 45–60 s"; null for reps or when min = max. */
export function formatTimeRangeHint(target: Target, t: TFunction): string | null {
  if (target.type !== 'time' || target.minSec === target.maxSec) return null;
  return t('common.target.timeRange', { min: target.minSec, max: target.maxSec });
}

/** "Lewa noga" / "Prawa strona" (FR11). */
export function sideLabel(side: Side, category: Category | undefined, t: TFunction): string {
  return t(`common.side.${side}.${sideUnit(category)}`);
}

/** Whole seconds → "m:ss" (or "h:mm:ss" ≥ 1 h). Negative values clamp to 0. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

/** Remaining ms → whole seconds shown on a countdown (ceil, never negative). */
export function remainingSec(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/** Overtime after a finished rest: "+0:12" (D16). */
export function formatOvertime(overSec: number): string {
  return `+${formatClock(overSec)}`;
}

/** Human duration: "45 s", "32 min", "1 h 5 min". */
export function formatDuration(totalSec: number, t: TFunction): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return t('common.duration.sec', { count: s });
  const totalMin = Math.round(s / 60);
  if (totalMin < 60) return t('common.duration.min', { count: totalMin });
  return t('common.duration.hMin', { h: Math.floor(totalMin / 60), m: totalMin % 60 });
}
