import type { CSSProperties } from 'react';
import { CategoryBadge, Stepper } from '../../components';
import { CATEGORIES } from '../../domain/builtins';
import { exerciseName, formatClock, formatSetsTarget, formatTimeRangeHint } from '../../domain/format';
import { blocksOf } from '../../domain/generator';
import { groupKind } from '../../domain/items';
import type { Exercise, ExercisesById, WorkoutItem, WorkoutMode } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { useT } from '../../i18n';
import './home.css';

interface Row {
  item: WorkoutItem;
  ex: Exercise;
  idx: number;
}

export interface PlanListProps {
  items: readonly WorkoutItem[];
  exercisesById: ExercisesById;
  /** straight (default): linked groups and per-block rests are shown; circuit: flat list */
  mode?: WorkoutMode;
  /** set → each block gets a rest stepper (straight mode); receives the new items array */
  onItemsChange?: (items: WorkoutItem[]) => void;
}

/** Rest stepper granularity in the plan (same as the classic-mode panel). */
const REST_STEP = 15;

/**
 * FR7: exercises in workout order as a numbered timeline. Unknown exercise ids are skipped.
 * In straight mode, linked items render as one superset / circuit block, and every block shows
 * (and can change) its rest.
 */
export function PlanList({ items, exercisesById, mode = 'straight', onItemsChange }: PlanListProps) {
  const t = useT();
  const rows: Row[] = items.flatMap((item, idx) => {
    const ex = exercisesById[item.exerciseId];
    return ex ? [{ item, ex, idx }] : [];
  });
  const numberOf = new Map(rows.map((r, n) => [r, n + 1]));
  const blocks =
    mode === 'circuit' ? rows.map((r) => [{ ...r, item: { ...r.item, linkNext: false } }]) : blocksOf(rows);

  const setBlockRest = (lastIdx: number, sec: number) => {
    if (!onItemsChange) return;
    onItemsChange(items.map((it, i) => (i === lastIdx ? { ...it, restSec: sec } : it)));
  };

  return (
    <ol className="plan stagger">
      {blocks.map((block) => {
        const last = block[block.length - 1]!;
        const kind = groupKind(block.length);
        // Blocks without their own rest follow the workout-wide panel above, so only own rests show here.
        const restValue = last.item.restSec ?? 0;
        const restLabel = t(kind ? 'preview.plan.restAfterRound' : 'preview.plan.restAfterSet');
        const restControl =
          mode === 'straight' && last.item.restSec !== undefined ? (
            onItemsChange ? (
              <Stepper
                className="plan__rest"
                label={restLabel}
                value={restValue}
                min={LIMITS.restMinSec}
                max={LIMITS.restMaxSec}
                step={REST_STEP}
                format={(v) => (v === 0 ? t('preview.rest.none') : formatClock(v))}
                onChange={(v) => setBlockRest(last.idx, v)}
              />
            ) : (
              <span className="plan__rest-text">
                {restLabel}: {restValue === 0 ? t('preview.rest.none') : formatClock(restValue)}
              </span>
            )
          ) : null;

        if (!kind) {
          const r = block[0]!;
          return (
            <PlanRow
              key={`${r.idx}-${r.item.exerciseId}`}
              row={r}
              n={numberOf.get(rows.find((x) => x.idx === r.idx)!)!}
            >
              {restControl}
            </PlanRow>
          );
        }
        const rounds = block.reduce((m, r) => Math.max(m, r.item.sets), 0);
        return (
          <li key={`g${block[0]!.idx}`} className={`plan__group plan__group--${kind}`}>
            <div className="plan__group-head">
              <span className="plan__group-kind">{t(`preview.plan.${kind}`)}</span>
              <span className="plan__group-rounds tabular">{t('preview.plan.rounds', { count: rounds })}</span>
            </div>
            <ol className="plan plan--nested">
              {block.map((r) => (
                <PlanRow
                  key={`${r.idx}-${r.item.exerciseId}`}
                  row={r}
                  n={numberOf.get(rows.find((x) => x.idx === r.idx)!)!}
                />
              ))}
            </ol>
            <p className="plan__group-hint">{t('preview.plan.groupHint')}</p>
            {restControl}
          </li>
        );
      })}
    </ol>
  );
}

function PlanRow({ row, n, children }: { row: Row; n: number; children?: React.ReactNode }) {
  const t = useT();
  const { item, ex } = row;
  const hint = formatTimeRangeHint(item.target, t);
  const style = {
    '--cat': `var(${CATEGORIES[ex.category].cssVar})`,
  } as CSSProperties;
  return (
    <li className="plan__row" style={style}>
      <span className="plan__num tabular" aria-hidden="true">
        {n}
      </span>
      <span className="plan__body">
        <span className="plan__name">{exerciseName(ex, t)}</span>
        <span className="plan__meta">
          <CategoryBadge category={ex.category} size="sm" />
          <span className="plan__target tabular">
            {formatSetsTarget(item.sets, item.target, t, {
              unilateral: ex.unilateral,
              category: ex.category,
            })}
          </span>
        </span>
        {hint && <span className="plan__hint">{hint}</span>}
        {item.noteKey && <span className="plan__hint plan__note">{t(item.noteKey)}</span>}
        {children}
      </span>
    </li>
  );
}
