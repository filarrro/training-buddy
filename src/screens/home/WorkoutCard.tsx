import type { CSSProperties } from 'react';
import { CategoryBadge, Icon, cx } from '../../components';
import { CATEGORIES } from '../../domain/builtins';
import { formatEstimate } from '../../domain/estimate';
import { workoutName } from '../../domain/format';
import type { ExercisesById, Workout } from '../../domain/types';
import { useT } from '../../i18n';
import { workoutStats } from './workoutStats';
import './home.css';

export interface WorkoutCardProps {
  workout: Workout;
  exercisesById: ExercisesById;
  onOpen: (workout: Workout) => void;
  onEdit: (workout: Workout) => void;
  /** plan context: suggested next workout / the one finished last */
  badge?: 'next' | 'last';
}

/** Start-screen card (FR3, FR5). Empty workouts open the editor instead of the preview. */
export function WorkoutCard({ workout, exercisesById, onOpen, onEdit, badge }: WorkoutCardProps) {
  const t = useT();
  const name = workoutName(workout, t);
  const stats = workoutStats(workout, exercisesById);
  const empty = stats.exerciseCount === 0;
  const first = stats.categories[0];
  const style = {
    '--wc-accent': first ? `var(${CATEGORIES[first].cssVar})` : 'var(--c-muted)',
  } as CSSProperties;

  return (
    <button
      type="button"
      className={cx('wcard', 'press', empty && 'wcard--empty', badge === 'next' && 'wcard--next')}
      style={style}
      onClick={() => (empty ? onEdit(workout) : onOpen(workout))}
    >
      <span className="wcard__glow" aria-hidden="true" />
      <span className="wcard__top">
        <span className="wcard__titles">
          <span className="wcard__name">{name}</span>
          <span className="wcard__chips">
            <span className={cx('chip', workout.mode === 'circuit' ? 'chip--rest' : 'chip--work')}>
              <Icon name={workout.mode === 'circuit' ? 'repeat' : 'list'} size={14} />
              {t(`common.mode.${workout.mode}`)}
            </span>
            {badge === 'next' && (
              <span className="chip chip--next">
                <Icon name="forward" size={14} />
                {t('start.plan.next')}
              </span>
            )}
            {badge === 'last' && <span className="chip">{t('start.plan.last')}</span>}
            {workout.builtIn && !badge && <span className="chip">{t('common.builtIn')}</span>}
          </span>
        </span>
        <span className={cx('wcard__go', empty && 'wcard__go--edit')} aria-hidden="true">
          <Icon name={empty ? 'plus' : 'play'} size={22} strokeWidth={2.4} />
        </span>
      </span>

      {empty ? (
        <span className="wcard__empty">
          <span className="chip chip--danger">{t('common.noExercises')}</span>
          <span className="muted">{t('start.card.addExercises')}</span>
        </span>
      ) : (
        <>
          <span className="wcard__meta tabular">
            <span className="wcard__stat">
              <Icon name="dumbbell" size={16} />
              {t('common.count.exercises', { count: stats.exerciseCount })}
            </span>
            <span className="wcard__dot" aria-hidden="true" />
            <span className="wcard__stat">{t('start.card.sets', { count: stats.setCount })}</span>
            <span className="wcard__dot" aria-hidden="true" />
            <span className="wcard__stat wcard__stat--time">
              <Icon name="timer" size={16} />
              {formatEstimate(stats.estimateSec, t)}
            </span>
          </span>
          <span className="wcard__cats">
            {stats.categories.map((c) => (
              <CategoryBadge key={c} category={c} size="dot" />
            ))}
          </span>
        </>
      )}
    </button>
  );
}
