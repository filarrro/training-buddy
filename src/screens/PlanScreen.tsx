import { useShallow } from 'zustand/react/shallow';
import { nav } from '../app/nav';
import { Button, IconButton, ScreenHeader } from '../components';
import type { Workout } from '../domain/types';
import { useT } from '../i18n';
import { getPlanWorkouts, nextPlanWorkoutId, planName, useExercisesById, useLibrary, usePlan } from '../stores/library';
import { WorkoutCard } from './home/WorkoutCard';
import './home/home.css';

/** Plan screen: choose which workout of the plan to do; the suggested next one is highlighted. */
export function PlanScreen({ planId }: { planId: string }) {
  const t = useT();
  const plan = usePlan(planId);
  const byId = useExercisesById();
  // Subscribe to the data the derived values depend on.
  const workouts = useLibrary(useShallow((s) => (plan ? getPlanWorkouts(plan, s) : [])));
  const nextId = useLibrary((s) => (plan ? nextPlanWorkoutId(plan, s) : undefined));
  const lastId = useLibrary((s) => s.planLast[planId]?.workoutId);

  if (!plan) {
    return (
      <div className="screen">
        <ScreenHeader title={t('start.plan.notFound')} onBack={nav.back} />
        <div className="screen-body" />
      </div>
    );
  }

  const open = (w: Workout) => nav.go({ name: 'preview', workoutId: w.id });
  const editWorkout = (w: Workout) => nav.go({ name: 'configWorkout', workoutId: w.id });
  const editPlan = () => nav.go({ name: 'configPlan', planId: plan.id });

  return (
    <div className="screen plan-screen">
      <ScreenHeader
        title={planName(plan, t)}
        eyebrow={t('start.plan.eyebrow')}
        onBack={nav.back}
        actions={<IconButton icon="edit" label={t('start.plan.edit')} onClick={editPlan} />}
      />
      <div className="screen-body">
        {plan.noteKey && <p className="workout-note fade-up">{t(plan.noteKey)}</p>}
        {workouts.length === 0 ? (
          <div className="empty-note fade-up">
            <p>{t('start.plan.emptyHint')}</p>
            <Button variant="secondary" icon="plus" onClick={editPlan}>
              {t('start.plan.edit')}
            </Button>
          </div>
        ) : (
          <>
            <p className="muted fade-up">{t('start.plan.choose')}</p>
            <ul className="wlist stagger" role="list">
              {workouts.map((w) => (
                <li key={w.id}>
                  <WorkoutCard
                    workout={w}
                    exercisesById={byId}
                    onOpen={open}
                    onEdit={editWorkout}
                    badge={w.id === nextId ? 'next' : w.id === lastId ? 'last' : undefined}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
