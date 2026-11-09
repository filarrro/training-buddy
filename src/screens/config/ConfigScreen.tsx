import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { nav } from '../../app/nav';
import { Button, CategoryBadge, ConfirmDialog, Icon, IconButton, ScreenHeader, cx } from '../../components';
import { CATEGORIES } from '../../domain/builtins';
import { exerciseName, formatSetsTarget, formatTimeRangeHint, workoutName } from '../../domain/format';
import { CATEGORY_IDS } from '../../domain/types';
import type { Exercise, Workout } from '../../domain/types';
import { useT } from '../../i18n';
import type { TFunction } from '../../i18n';
import {
  isBuiltinOverridden,
  planName,
  plansUsingWorkout,
  useAllExercises,
  useAllWorkouts,
  useExercisesById,
  useLibrary,
  workoutsUsingExercise,
} from '../../stores/library';
import { showToast } from '../../stores/toast';
import { useConfigUi } from './configUi';
import type { ConfigTab } from './configUi';
import { Segmented } from './fields';
import { PlansTab } from './PlansTab';
import './config.css';

/** Configurator: plans, workouts (T5) and exercise library (T6). */
export function ConfigScreen() {
  const t = useT();
  const tab = useConfigUi((s) => s.tab);
  const setTab = useConfigUi((s) => s.setTab);
  const highlightId = useConfigUi((s) => s.highlightId);

  // Highlight is a one-shot: clear it after the animation had a chance to run.
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => useConfigUi.getState().highlight(null), 1600);
    return () => clearTimeout(timer);
  }, [highlightId]);

  return (
    <div className="screen cfg">
      <ScreenHeader title={t('config.title')} eyebrow={t('config.eyebrow')} onBack={nav.back} />
      <div className="cfg-tabs-wrap">
        <Segmented<ConfigTab>
          label={t('config.title')}
          value={tab}
          tone="neutral"
          onChange={setTab}
          options={[
            { value: 'plans', label: t('config.tab.plans') },
            { value: 'workouts', label: t('config.tab.workouts') },
            { value: 'exercises', label: t('config.tab.exercises') },
          ]}
        />
      </div>
      {tab === 'plans' ? (
        <PlansTab key="p" highlightId={highlightId} />
      ) : tab === 'workouts' ? (
        <WorkoutsTab key="w" highlightId={highlightId} />
      ) : (
        <ExercisesTab key="e" highlightId={highlightId} />
      )}
    </div>
  );
}

// ---------- Workouts tab ----------

function WorkoutsTab({ highlightId }: { highlightId: string | null }) {
  const t = useT();
  const workouts = useAllWorkouts();
  const exercisesById = useExercisesById();
  const library = useLibrary((s) => s.workouts);
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'restore'; workout: Workout } | null>(null);

  const builtins = workouts.filter((w) => w.builtIn);
  const custom = workouts.filter((w) => !w.builtIn);

  const duplicate = (w: Workout) => {
    const id = useLibrary.getState().duplicateWorkout(w.id, t);
    if (!id) return;
    const copy = useLibrary.getState().workouts.find((x) => x.id === id);
    useConfigUi.getState().highlight(id);
    showToast(t('config.workouts.duplicated', { name: copy ? workoutName(copy, t) : '' }), { tone: 'success' });
  };

  const onConfirm = () => {
    if (!confirm) return;
    const name = workoutName(confirm.workout, t);
    if (confirm.kind === 'delete') {
      useLibrary.getState().deleteWorkout(confirm.workout.id);
      showToast(t('config.workouts.deleted', { name }));
    } else {
      useLibrary.getState().restoreBuiltin(confirm.workout.id);
      useConfigUi.getState().highlight(confirm.workout.id);
      showToast(t('config.workouts.restored', { name: workoutName({ ...confirm.workout, name: undefined }, t) }), {
        tone: 'success',
      });
    }
    setConfirm(null);
  };

  const row = (w: Workout, i: number) => {
    const overridden = isBuiltinOverridden(w.id, { exercises: [], workouts: library, plans: [], planLast: {} });
    return (
      <WorkoutRow
        key={w.id}
        workout={w}
        index={i}
        t={t}
        exercisesById={exercisesById}
        overridden={overridden}
        highlighted={highlightId === w.id}
        onEdit={() => nav.go({ name: 'configWorkout', workoutId: w.id })}
        onDuplicate={() => duplicate(w)}
        onDelete={w.builtIn ? undefined : () => setConfirm({ kind: 'delete', workout: w })}
        onRestore={w.builtIn && overridden ? () => setConfirm({ kind: 'restore', workout: w }) : undefined}
      />
    );
  };

  return (
    <>
      <div className="screen-body cfg-body">
        <section className="cfg-section" aria-labelledby="cfg-w-builtin">
          <h2 id="cfg-w-builtin" className="eyebrow cfg-section__title">
            {t('config.workouts.builtinSection')}
          </h2>
          <div className="stack stagger">{builtins.map((w, i) => row(w, i))}</div>
        </section>
        <section className="cfg-section" aria-labelledby="cfg-w-custom">
          <h2 id="cfg-w-custom" className="eyebrow cfg-section__title">
            {t('config.workouts.custom')}
          </h2>
          {custom.length === 0 ? (
            <div className="cfg-empty fade-up">
              <Icon name="flag" size={28} />
              <p>{t('config.workouts.empty')}</p>
            </div>
          ) : (
            <div className="stack stagger">{custom.map((w, i) => row(w, i + builtins.length))}</div>
          )}
        </section>
      </div>
      <div className="action-bar">
        <Button size="lg" block icon="plus" onClick={() => nav.go({ name: 'configWorkout' })}>
          {t('config.workouts.new')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm
            ? confirm.kind === 'delete'
              ? t('config.workouts.deleteTitle', { name: workoutName(confirm.workout, t) })
              : t('config.workouts.restoreTitle', { name: workoutName({ ...confirm.workout, name: undefined }, t) })
            : ''
        }
        message={
          confirm?.kind === 'delete'
            ? deleteWorkoutMessage(confirm.workout.id, t)
            : t('config.workouts.restoreMessage')
        }
        confirmLabel={confirm?.kind === 'delete' ? t('common.action.delete') : t('config.workouts.restore')}
        tone="danger"
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function WorkoutRow({
  workout,
  index,
  t,
  exercisesById,
  overridden,
  highlighted,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
}: {
  workout: Workout;
  index: number;
  t: TFunction;
  exercisesById: Record<string, Exercise>;
  overridden: boolean;
  highlighted: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}) {
  const name = workoutName(workout, t);
  const exCount = workout.items.length;
  const sets = workout.items.reduce((n, i) => n + i.sets, 0);
  const cats = workout.items.map((i) => exercisesById[i.exerciseId]?.category).filter(Boolean);
  const accent = cats[0] ? `var(${CATEGORIES[cats[0]].cssVar})` : 'var(--c-border-strong)';
  return (
    <article
      className={cx('card cfg-row', highlighted && 'cfg-row--highlight')}
      style={{ '--i': index, '--row-accent': accent } as CSSProperties}
    >
      <button type="button" className="cfg-row__main press" onClick={onEdit} aria-label={`${t('common.action.edit')}: ${name}`}>
        <div className="cfg-row__titles">
          <h3 className="cfg-row__name">{name}</h3>
          <div className="cfg-row__tags">
            {workout.builtIn && <span className="cfg-tag">{t('common.builtIn')}</span>}
            {overridden && <span className="cfg-tag cfg-tag--work">{t('config.workouts.modified')}</span>}
          </div>
        </div>
        {exCount === 0 ? (
          <p className="cfg-row__meta text-danger">{t('common.noExercises')}</p>
        ) : (
          <p className="cfg-row__meta">
            {t(`common.mode.${workout.mode}`)} · {t('common.count.exercises', { count: exCount })} ·{' '}
            {t('common.count.sets', { count: sets })}
          </p>
        )}
        {cats.length > 0 && (
          <div className="cfg-row__dots" aria-hidden="true">
            {cats.map((c, i) => (
              <span key={i} className="cfg-dot" style={{ '--cat': `var(${CATEGORIES[c!].cssVar})` } as CSSProperties} />
            ))}
          </div>
        )}
      </button>
      <div className="cfg-row__actions">
        {onRestore && <IconButton icon="repeat" label={`${t('config.workouts.restore')}: ${name}`} onClick={onRestore} />}
        <IconButton icon="copy" label={`${t('common.action.duplicate')}: ${name}`} onClick={onDuplicate} />
        {onDelete && <IconButton icon="trash" label={`${t('common.action.delete')}: ${name}`} onClick={onDelete} />}
      </div>
    </article>
  );
}

// ---------- Exercises tab ----------

function ExercisesTab({ highlightId }: { highlightId: string | null }) {
  const t = useT();
  const exercises = useAllExercises();
  const workouts = useLibrary((s) => s.workouts);
  const groups = useMemo(
    () =>
      CATEGORY_IDS.map((c) => ({ category: c, items: exercises.filter((e) => e.category === c) })).filter(
        (g) => g.items.length > 0,
      ),
    [exercises],
  );

  const duplicate = (ex: Exercise) => {
    const id = useLibrary.getState().duplicateExercise(ex.id, t);
    if (!id) return;
    const copy = useLibrary.getState().exercises.find((x) => x.id === id);
    useConfigUi.getState().highlight(id);
    showToast(t('config.exercises.duplicated', { name: copy?.name ?? '' }), { tone: 'success' });
  };

  let i = 0;
  return (
    <>
      <div className="screen-body cfg-body">
        {groups.map((g) => (
          <section key={g.category} className="cfg-section" aria-label={t(CATEGORIES[g.category].labelKey)}>
            <div className="cfg-group-head row-between fade-up" style={{ '--i': i } as CSSProperties}>
              <CategoryBadge category={g.category} size="md" />
              <span className="muted tabular">{t('config.exercises.groupCount', { count: g.items.length })}</span>
            </div>
            <div className="stack stagger">
              {g.items.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  index={i++}
                  t={t}
                  usedIn={ex.builtIn ? 0 : workoutsUsingExercise(ex.id, { exercises: [], workouts, plans: [], planLast: {} }).length}
                  highlighted={highlightId === ex.id}
                  onOpen={() => nav.go({ name: 'configExercise', exerciseId: ex.id })}
                  onDuplicate={() => duplicate(ex)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="action-bar">
        <Button size="lg" block icon="plus" onClick={() => nav.go({ name: 'configExercise' })}>
          {t('config.exercises.new')}
        </Button>
      </div>
    </>
  );
}

function ExerciseRow({
  exercise,
  index,
  t,
  usedIn,
  highlighted,
  onOpen,
  onDuplicate,
}: {
  exercise: Exercise;
  index: number;
  t: TFunction;
  usedIn: number;
  highlighted: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
}) {
  const name = exerciseName(exercise, t);
  const opts = { unilateral: exercise.unilateral, category: exercise.category };
  const hint = formatTimeRangeHint(exercise.defaultTarget, t);
  return (
    <article
      className={cx('card cfg-row', highlighted && 'cfg-row--highlight')}
      style={{ '--i': Math.min(index, 9), '--row-accent': `var(${CATEGORIES[exercise.category].cssVar})` } as CSSProperties}
    >
      <button
        type="button"
        className="cfg-row__main press"
        onClick={onOpen}
        aria-label={`${exercise.builtIn ? t('config.exercise.viewTitle') : t('common.action.edit')}: ${name}`}
      >
        <div className="cfg-row__titles">
          <h3 className="cfg-row__name">{name}</h3>
          {exercise.builtIn && (
            <div className="cfg-row__tags">
              <span className="cfg-tag">
                <Icon name="lock" size={12} /> {t('common.builtIn')}
              </span>
            </div>
          )}
        </div>
        <p className="cfg-row__meta tabular">
          {formatSetsTarget(exercise.defaultSets, exercise.defaultTarget, t, opts)}
          {hint && ` · ${hint}`}
        </p>
        {usedIn > 0 && <p className="cfg-row__meta cfg-row__meta--sub">{t('config.exercises.usedIn', { count: usedIn })}</p>}
      </button>
      <div className="cfg-row__actions">
        <IconButton icon="copy" label={`${t('common.action.duplicate')}: ${name}`} onClick={onDuplicate} />
      </div>
    </article>
  );
}

/** "Cannot be undone" + the plans the workout will be removed from. */
export function deleteWorkoutMessage(workoutId: string, t: TFunction): string {
  const plans = plansUsingWorkout(workoutId).map((p) => planName(p, t));
  const base = t('config.workouts.deleteMessage');
  return plans.length ? `${t('config.workouts.inPlans', { names: plans.join(', ') })} ${base}` : base;
}
