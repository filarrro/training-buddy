import { nav } from '../app/nav';
import { Button, IconButton, ScreenHeader } from '../components';
import { formatEstimate } from '../domain/estimate';
import { workoutName } from '../domain/format';
import { blocksOf } from '../domain/generator';
import type { RestSettings, WorkoutItem, WorkoutMode } from '../domain/types';
import { useT } from '../i18n';
import { useExercisesById, useLibrary, useWorkout } from '../stores/library';
import { PlanList } from './home/PlanList';
import { RestPanel } from './home/RestPanel';
import { Segmented } from './home/Segmented';
import { workoutStats } from './home/workoutStats';
import './home/home.css';

const MODES: readonly WorkoutMode[] = ['straight', 'circuit'];

/** Animated numeric stat: re-keyed on change so the value "ticks" in. */
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={accent ? 'stat stat--accent' : 'stat'}>
      <span key={value} className="stat__value tabular tick">
        {value}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

/** Workout preview (FR5, FR7, FR8, FR9): plan, mode, rests, live estimate and Start. */
export function PreviewScreen({ workoutId }: { workoutId: string }) {
  const t = useT();
  const workout = useWorkout(workoutId);
  const byId = useExercisesById();

  if (!workout) {
    return (
      <div className="screen">
        <ScreenHeader title={t('preview.notFound')} onBack={nav.back} />
        <div className="screen-body" />
      </div>
    );
  }

  const name = workoutName(workout, t);
  const stats = workoutStats(workout, byId);
  const empty = stats.exerciseCount === 0;
  const hasSides = workout.items.some((i) => byId[i.exerciseId]?.unilateral);
  const update = useLibrary.getState().updateWorkout;
  const setMode = (mode: WorkoutMode) => update(workout.id, { mode });
  const setRest = (rest: RestSettings) => update(workout.id, { rest });
  const setItems = (items: WorkoutItem[]) => update(workout.id, { items });
  const perExerciseRests = blocksOf(workout.items.map((item) => ({ item }))).every((b) => b[b.length - 1]!.item.restSec !== undefined);
  const edit = () => nav.go({ name: 'configWorkout', workoutId: workout.id });

  return (
    <div className="screen preview">
      <ScreenHeader
        title={name}
        eyebrow={t('preview.eyebrow')}
        onBack={nav.back}
        actions={<IconButton icon="edit" label={t('preview.edit')} onClick={edit} />}
      />

      <div className="screen-body">
        <div className="stats stagger">
          <Stat label={t('preview.stat.exercises')} value={String(stats.exerciseCount)} />
          <Stat label={t('preview.stat.sets')} value={String(stats.setCount)} />
          <Stat
            label={t('preview.stat.time')}
            value={empty ? '–' : formatEstimate(stats.estimateSec, t)}
            accent
          />
        </div>

        {workout.noteKey && <p className="workout-note fade-up">{t(workout.noteKey)}</p>}

        {empty ? (
          <div className="empty-note fade-up">
            <p>{t('preview.empty')}</p>
            <Button variant="secondary" icon="plus" onClick={edit}>
              {t('preview.edit')}
            </Button>
          </div>
        ) : (
          <>
            <section className="stack fade-up" aria-labelledby="mode-title">
              <h2 id="mode-title" className="section-title">
                {t('preview.mode.label')}
              </h2>
              <Segmented
                label={t('preview.mode.label')}
                value={workout.mode}
                tone={workout.mode === 'circuit' ? 'rest' : 'work'}
                options={MODES.map((m) => ({ value: m, label: t(`common.mode.${m}`) }))}
                onChange={setMode}
              />
              <p key={workout.mode} className="mode-hint fade-in">
                {t(`preview.mode.${workout.mode}.hint`)}
              </p>
            </section>

            <section className="stack fade-up" aria-labelledby="rest-title">
              <h2 id="rest-title" className="section-title">
                {t('preview.rest.title')}
              </h2>
              <RestPanel
                mode={workout.mode}
                rest={workout.rest}
                showSides={hasSides}
                perExerciseRests={perExerciseRests}
                onChange={setRest}
              />
              <p className="muted small">{t('preview.rest.savedHint')}</p>
            </section>

            <section className="stack" aria-labelledby="plan-title">
              <h2 id="plan-title" className="section-title">
                {t('preview.plan.title')}
                {workout.mode === 'circuit' && (
                  <span key="rounds" className="section-title__aside fade-in">
                    {t('preview.plan.rounds', { count: stats.rounds })}
                  </span>
                )}
              </h2>
              <PlanList
                items={workout.items}
                exercisesById={byId}
                mode={workout.mode}
                onItemsChange={setItems}
              />
            </section>

            <Button variant="ghost" icon="edit" onClick={edit} className="preview__edit">
              {t('preview.edit')}
            </Button>
          </>
        )}
      </div>

      <div className="action-bar">
        <Button
          size="lg"
          block
          icon="play"
          disabled={empty}
          className={empty ? undefined : 'start-btn'}
          onClick={() => nav.startSession(workout.id)}
        >
          {t('preview.start')}
        </Button>
      </div>
    </div>
  );
}
