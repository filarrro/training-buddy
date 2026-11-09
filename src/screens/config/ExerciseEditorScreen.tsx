import { useMemo, useRef, useState } from 'react';
import { useBackGuard } from '../../app/backGuard';
import { nav } from '../../app/nav';
import { Button, ConfirmDialog, Icon, ScreenHeader, Stepper } from '../../components';
import { CATEGORIES, isBuiltinId } from '../../domain/builtins';
import { exerciseName, workoutName } from '../../domain/format';
import type { Exercise, TargetType } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { useT } from '../../i18n';
import {
  getExercise,
  isExerciseNameTaken,
  newId,
  useLibrary,
  workoutsUsingExercise,
} from '../../stores/library';
import { showToast } from '../../stores/toast';
import { useConfigUi } from './configUi';
import { CategoryPicker, Segmented, Switch, TargetFields, TextField, TypeIcon } from './fields';
import {
  buildExercise,
  exerciseDraft,
  exerciseErrors,
  exerciseFingerprint,
  hasExerciseErrors,
} from './forms';
import type { ExerciseDraft } from './forms';
import { shake } from './motion';
import './config.css';

type Dialog = 'discard' | 'delete' | 'typeChange' | null;

/** Create / edit a custom exercise (FR22, FR23, D33, D34); built-ins open read-only (D18). */
export function ExerciseEditorScreen({ exerciseId }: { exerciseId?: string }) {
  const t = useT();
  const [base] = useState<Exercise | undefined>(() => (exerciseId ? getExercise(exerciseId) : undefined));
  if (exerciseId && !base) {
    return (
      <div className="screen cfg">
        <ScreenHeader title={t('config.exercise.editTitle')} onBack={nav.back} />
        <div className="screen-body">
          <div className="cfg-empty fade-up">
            <Icon name="info" size={28} />
            <p>{t('config.form.notFound')}</p>
          </div>
        </div>
      </div>
    );
  }
  return <ExerciseEditor key={exerciseId ?? 'new'} base={base} />;
}

function ExerciseEditor({ base }: { base: Exercise | undefined }) {
  const t = useT();
  const isNew = !base;
  const readOnly = base ? isBuiltinId(base.id) : false;
  const id = useMemo(() => base?.id ?? newId(), [base]);
  const workouts = useLibrary((s) => s.workouts);
  const usedIn = useMemo(
    () => (isNew || readOnly ? [] : workoutsUsingExercise(id, { exercises: [], workouts, plans: [], planLast: {} })),
    [id, isNew, readOnly, workouts],
  );

  const [initial] = useState(() => {
    const d = exerciseDraft(base);
    // Built-ins are shown with their translated name (read-only).
    if (base && !base.name) d.name = exerciseName(base, t);
    return d;
  });
  const [draft, setDraft] = useState<ExerciseDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  const errors = exerciseErrors(draft, (n) => isExerciseNameTaken(n, id));
  const dirty = !readOnly && exerciseFingerprint(draft) !== exerciseFingerprint(initial);
  const showNameError = errors.name && (submitted || nameTouched) && (errors.name !== 'nameRequired' || submitted);
  const typeChanged = !!base && base.defaultTarget.type !== draft.target.type;

  const update = (patch: Partial<ExerciseDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const leave = () => (dirty ? setDialog('discard') : nav.back());
  // System back on a dirty form asks too (same as the in-app back button).
  useBackGuard(() => {
    if (!dirty || dialog !== null) return false;
    setDialog('discard');
    return true;
  });

  const commit = () => {
    const ex = buildExercise(id, draft);
    useLibrary.getState().saveExercise(ex); // D34: a type change replaces item targets, sets kept
    useConfigUi.getState().highlight(id);
    showToast(t('config.form.saved'), { tone: 'success' });
    nav.back();
  };

  const save = () => {
    setSubmitted(true);
    if (hasExerciseErrors(errors)) {
      shake(saveRef.current);
      const firstInvalid = document.querySelector<HTMLElement>('.cfg [aria-invalid="true"]');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus({ preventScroll: true });
      return;
    }
    if (!dirty && !isNew) {
      nav.back();
      return;
    }
    if (typeChanged && usedIn.length > 0) {
      setDialog('typeChange');
      return;
    }
    commit();
  };

  const duplicate = () => {
    const newIdValue = useLibrary.getState().duplicateExercise(id, t);
    if (!newIdValue) return;
    const copy = useLibrary.getState().exercises.find((x) => x.id === newIdValue);
    useConfigUi.getState().highlight(newIdValue);
    showToast(t('config.exercises.duplicated', { name: copy?.name ?? '' }), { tone: 'success' });
    nav.replace({ name: 'configExercise', exerciseId: newIdValue });
  };

  const remove = () => {
    const name = base ? exerciseName(base, t) : '';
    useLibrary.getState().deleteExercise(id);
    setDialog(null);
    showToast(t('config.exercise.deleted', { name }));
    nav.back();
  };

  const sideUnit = CATEGORIES[draft.category].sideUnit;
  const title = readOnly ? t('config.exercise.viewTitle') : isNew ? t('config.exercise.newTitle') : t('config.exercise.editTitle');

  return (
    <div className="screen cfg">
      <ScreenHeader title={title} eyebrow={base ? exerciseName(base, t) : t('config.title')} onBack={leave} />
      <div className="screen-body cfg-body">
        <div className="stack-lg stagger">
          {readOnly && (
            <div className="cfg-note">
              <Icon name="lock" size={18} />
              <p>{t('config.exercise.builtinNote')}</p>
            </div>
          )}

          <TextField
            label={t('config.form.name')}
            value={draft.name}
            onChange={(name) => {
              update({ name });
              setNameTouched(true);
            }}
            placeholder={t('config.exercise.namePlaceholder')}
            maxLength={LIMITS.exerciseNameMax}
            error={showNameError ? t(`config.error.${errors.name}`, { max: LIMITS.exerciseNameMax }) : null}
            disabled={readOnly}
            autoFocus={isNew}
          />

          <CategoryPicker
            label={t('config.exercise.category')}
            value={draft.category}
            onChange={(category) => update({ category })}
            disabled={readOnly}
          />

          <Switch
            label={`${t('config.exercise.unilateral')} (${t(sideUnit === 'leg' ? 'common.target.perLeg' : sideUnit === 'arm' ? 'common.target.perArm' : 'common.target.perSide')})`}
            hint={t(`config.exercise.unilateralHint.${sideUnit}`)}
            checked={draft.unilateral}
            onChange={(unilateral) => update({ unilateral })}
            disabled={readOnly}
          />

          <section className="cfg-card card" aria-labelledby="cfg-defaults">
            <h2 id="cfg-defaults" className="cfg-label">
              {t('config.exercise.defaults')}
            </h2>
            <p className="cfg-hint">{t('config.exercise.defaultsHint')}</p>
            <div className="cfg-field">
              <span className="cfg-label cfg-label--sm">{t('config.form.type')}</span>
              <Segmented<TargetType>
                label={t('config.form.type')}
                value={draft.target.type}
                onChange={(type) => update({ target: { ...draft.target, type } })}
                disabled={readOnly}
                options={[
                  { value: 'reps', label: t('config.form.type.reps'), icon: <TypeIcon type="reps" /> },
                  { value: 'time', label: t('config.form.type.time'), icon: <TypeIcon type="time" /> },
                ]}
              />
            </div>
            <Stepper
              label={t('config.form.sets')}
              value={draft.sets}
              min={LIMITS.setsMin}
              max={LIMITS.setsMax}
              onChange={(sets) => update({ sets })}
              disabled={readOnly}
            />
            <TargetFields
              draft={draft.target}
              onChange={(target) => update({ target })}
              errors={errors.target}
              disabled={readOnly}
            />
          </section>

          {!isNew && !readOnly && (
            <div className="cfg-danger-zone">
              <Button variant="ghost" block icon="trash" className="cfg-btn-danger" onClick={() => setDialog('delete')}>
                {t('config.exercise.delete')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="action-bar cfg-save-bar" ref={saveRef}>
        {readOnly ? (
          <Button size="lg" block icon="copy" onClick={duplicate}>
            {t('common.action.duplicate')}
          </Button>
        ) : (
          <>
            {submitted && hasExerciseErrors(errors) && (
              <p className="cfg-save-bar__msg text-danger fade-in" role="status">
                {t('config.form.fixErrors')}
              </p>
            )}
            <Button size="lg" block icon="check" onClick={save}>
              {t('common.action.save')}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={dialog === 'discard'}
        title={t('config.form.discardTitle')}
        message={t('config.form.discardMessage')}
        confirmLabel={t('config.form.discard')}
        tone="danger"
        onConfirm={() => {
          setDialog(null);
          nav.back();
        }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'typeChange'}
        title={t('config.exercise.typeChangeTitle')}
        message={t('config.exercise.typeChangeMessage', { count: usedIn.length })}
        confirmLabel={t('config.exercise.typeChangeConfirm')}
        onConfirm={() => {
          setDialog(null);
          commit();
        }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={t('config.exercise.deleteTitle', { name: base ? exerciseName(base, t) : '' })}
        message={
          usedIn.length === 0 ? (
            t('config.exercise.deleteUnused')
          ) : (
            <>
              <p>{t('config.exercise.deleteUsed')}</p>
              <ul className="cfg-used-list">
                {usedIn.map((w) => (
                  <li key={w.id}>{workoutName(w, t)}</li>
                ))}
              </ul>
            </>
          )
        }
        confirmLabel={t('common.action.delete')}
        tone="danger"
        onConfirm={remove}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
