import { nav } from '../app/nav';
import { toggleTheme, useResolvedTheme } from '../app/theme';
import { Icon, IconButton } from '../components';
import type { Plan, Workout } from '../domain/types';
import { useT } from '../i18n';
import { InstallChip } from '../pwa/InstallChip';
import { useShallow } from 'zustand/react/shallow';
import {
  getLooseWorkouts,
  getPlanWorkouts,
  nextPlanWorkoutId,
  useAllPlans,
  useExercisesById,
  useLibrary,
} from '../stores/library';
import { PlanCard } from './home/PlanCard';
import { WorkoutCard } from './home/WorkoutCard';
import './home/home.css';

function greetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'start.greeting.morning';
  if (hour >= 12 && hour < 18) return 'start.greeting.afternoon';
  if (hour >= 18 && hour < 23) return 'start.greeting.evening';
  return 'start.greeting.night';
}

/** Highlights `accent` inside `title` with the ember gradient (falls back to plain text). */
function HeroTitle({ title, accent }: { title: string; accent: string }) {
  const at = accent ? title.indexOf(accent) : -1;
  if (at < 0) return <h1 className="hero__title">{title}</h1>;
  return (
    <h1 className="hero__title">
      {title.slice(0, at)}
      <span className="text-gradient-work">{accent}</span>
      {title.slice(at + accent.length)}
    </h1>
  );
}

/** Start screen (FR3, FR5): hero, workout cards, entry to configurator and settings. */
export function StartScreen() {
  const t = useT();
  const plans = useAllPlans();
  const workouts = useLibrary(useShallow((s) => getLooseWorkouts(s)));
  // Re-render when workouts or plan progress change (plan cards derive from them).
  const lib = useLibrary(
    useShallow((s) => ({
      workouts: s.workouts,
      plans: s.plans,
      planLast: s.planLast,
      exercises: s.exercises,
    })),
  );
  const byId = useExercisesById();
  const theme = useResolvedTheme();

  const open = (w: Workout) => nav.go({ name: 'preview', workoutId: w.id });
  const openPlan = (p: Plan) => nav.go({ name: 'plan', planId: p.id });
  const edit = (w: Workout) => nav.go({ name: 'configWorkout', workoutId: w.id });

  return (
    <div className="screen home">
      <header className="home-bar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="bolt" size={20} strokeWidth={2.4} />
          </span>
          <span className="brand__name">{t('common.app.name')}</span>
        </div>
        <div className="home-bar__actions">
          <IconButton
            icon={theme === 'dark' ? 'sun' : 'moon'}
            label={t(theme === 'dark' ? 'start.theme.toLight' : 'start.theme.toDark')}
            onClick={toggleTheme}
          />
          <IconButton icon="settings" label={t('start.settings')} onClick={() => nav.go({ name: 'settings' })} />
        </div>
      </header>

      <div className="screen-body">
        <section className="hero" aria-labelledby="hero-title">
          <span className="hero__orb" aria-hidden="true" />
          <span className="hero__orb hero__orb--rest" aria-hidden="true" />
          <p className="eyebrow hero__eyebrow fade-up">{t(greetingKey(new Date().getHours()))}</p>
          <div id="hero-title" className="fade-up hero__title-wrap">
            <HeroTitle title={t('start.hero.title')} accent={t('start.hero.titleAccent')} />
          </div>
          <p className="hero__subtitle fade-up">{t('start.hero.subtitle')}</p>
        </section>

        <InstallChip />

        {plans.length > 0 && (
          <section className="stack" aria-labelledby="plans-title">
            <h2 id="plans-title" className="section-title">
              {t('start.section.plans')}
              <span className="section-title__count tabular">{plans.length}</span>
            </h2>
            <ul className="wlist stagger" role="list">
              {plans.map((p) => (
                <li key={p.id}>
                  <PlanCard
                    plan={p}
                    workouts={getPlanWorkouts(p, lib)}
                    exercisesById={byId}
                    nextId={nextPlanWorkoutId(p, lib)}
                    onOpen={openPlan}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {(workouts.length > 0 || plans.length === 0) && (
          <section className="stack" aria-labelledby="workouts-title">
            <h2 id="workouts-title" className="section-title">
              {t('start.section.single')}
              <span className="section-title__count tabular">{workouts.length}</span>
            </h2>
            {workouts.length === 0 ? (
              <p className="muted">{t(plans.length > 0 ? 'start.singleEmpty' : 'start.empty')}</p>
            ) : (
              <ul className="wlist stagger" role="list">
                {workouts.map((w) => (
                  <li key={w.id}>
                    <WorkoutCard workout={w} exercisesById={byId} onOpen={open} onEdit={edit} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="stagger" style={{ marginTop: 'var(--sp-2)' }}>
          <button type="button" className="config-entry press" onClick={() => nav.go({ name: 'config' })}>
            <span className="config-entry__icon" aria-hidden="true">
              <Icon name="dumbbell" size={22} />
            </span>
            <span className="config-entry__text">
              <span className="config-entry__title">{t('start.config.title')}</span>
              <span className="config-entry__sub">{t('start.config.subtitle')}</span>
            </span>
            <Icon name="forward" size={20} className="config-entry__chev" />
          </button>
        </div>
      </div>
    </div>
  );
}
