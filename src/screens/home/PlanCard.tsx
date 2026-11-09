import type { CSSProperties } from 'react';
import { CategoryBadge, Icon, cx } from '../../components';
import { CATEGORIES } from '../../domain/builtins';
import { workoutName } from '../../domain/format';
import type { Category, ExercisesById, Plan, Workout } from '../../domain/types';
import { useT } from '../../i18n';
import { planName } from '../../stores/library';
import './home.css';

export interface PlanCardProps {
  plan: Plan;
  /** existing workouts of the plan, in order */
  workouts: Workout[];
  exercisesById: ExercisesById;
  /** suggested next workout id */
  nextId: string | undefined;
  onOpen: (plan: Plan) => void;
}

/** Start-screen card of a plan: its workouts and the suggested next one. Opens the plan screen. */
export function PlanCard({ plan, workouts, exercisesById, nextId, onOpen }: PlanCardProps) {
  const t = useT();
  const next = workouts.find((w) => w.id === nextId);
  const cats: Category[] = [];
  for (const w of workouts)
    for (const i of w.items) {
      const c = exercisesById[i.exerciseId]?.category;
      if (c && !cats.includes(c)) cats.push(c);
    }
  const style = {
    '--wc-accent': cats[0] ? `var(${CATEGORIES[cats[0]].cssVar})` : 'var(--c-muted)',
  } as CSSProperties;

  return (
    <button type="button" className={cx('wcard', 'pcard', 'press')} style={style} onClick={() => onOpen(plan)}>
      <span className="wcard__glow" aria-hidden="true" />
      <span className="wcard__top">
        <span className="wcard__titles">
          <span className="eyebrow pcard__eyebrow">{t('start.plan.eyebrow')}</span>
          <span className="wcard__name">{planName(plan, t)}</span>
          <span className="wcard__chips">
            <span className="chip">{t('common.count.workouts', { count: workouts.length })}</span>
            {plan.builtIn && <span className="chip">{t('common.builtIn')}</span>}
          </span>
        </span>
        <span className="wcard__go" aria-hidden="true">
          <Icon name="forward" size={22} strokeWidth={2.4} />
        </span>
      </span>
      {workouts.length === 0 ? (
        <span className="wcard__empty">
          <span className="chip chip--danger">{t('start.plan.empty')}</span>
        </span>
      ) : (
        <>
          <span className="pcard__workouts">
            {workouts.map((w) => (
              <span key={w.id} className={cx('pcard__w', w.id === nextId && 'is-next')}>
                {workoutName(w, t)}
              </span>
            ))}
          </span>
          {next && (
            <span className="pcard__next">
              <Icon name="play" size={14} />
              {t('start.plan.nextIs', { name: workoutName(next, t) })}
            </span>
          )}
          <span className="wcard__cats">
            {cats.map((c) => (
              <CategoryBadge key={c} category={c} size="dot" />
            ))}
          </span>
        </>
      )}
    </button>
  );
}
