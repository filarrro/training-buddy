import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useBackGuard } from '../../app/backGuard';
import { nav } from '../../app/nav';
import { Button, ConfirmDialog, Icon, IconButton, ScreenHeader, Stepper, cx } from '../../components';
import { CATEGORIES, defaultRest, isBuiltinWorkoutId } from '../../domain/builtins';
import { exerciseName, formatClock, workoutName } from '../../domain/format';
import { removeItems } from '../../domain/items';
import type { Exercise, Workout, WorkoutMode } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { useT } from '../../i18n';
import {
  getWorkout,
  isBuiltinOverridden,
  isWorkoutNameTaken,
  itemFromExercise,
  newId,
  useExercisesById,
  useLibrary,
} from '../../stores/library';
import { showToast } from '../../stores/toast';
import { useConfigUi } from './configUi';
import { deleteWorkoutMessage } from './ConfigScreen';
import { ExercisePicker } from './ExercisePicker';
import { FieldError, Segmented, Switch, TargetFields, TextField, TypeIcon } from './fields';
import {
  buildWorkout,
  hasWorkoutErrors,
  itemDraft,
  moveItem,
  workoutDraft,
  workoutErrors,
  workoutFingerprint,
} from './forms';
import type { ItemDraft, WorkoutDraft } from './forms';
import { shake, useFlip } from './motion';
import './config.css';

type Dialog = 'discard' | 'delete' | 'restore' | null;

/** Create / edit a workout (FR25, FR26, D41, D45). workoutId undefined = new workout. */
export function WorkoutEditorScreen({ workoutId }: { workoutId?: string }) {
  const t = useT();
  // Snapshot at mount: the form owns its draft; the stored workout is only read again on save.
  const [base] = useState<Workout | undefined>(() => (workoutId ? getWorkout(workoutId) : undefined));
  if (workoutId && !base) return <NotFound />;
  return <WorkoutEditor key={workoutId ?? 'new'} base={base} t={t} />;
}

function NotFound() {
  const t = useT();
  return (
    <div className="screen cfg">
      <ScreenHeader title={t('config.workout.editTitle')} onBack={nav.back} />
      <div className="screen-body">
        <div className="cfg-empty fade-up">
          <Icon name="info" size={28} />
          <p>{t('config.form.notFound')}</p>
        </div>
      </div>
    </div>
  );
}

function WorkoutEditor({ base, t }: { base: Workout | undefined; t: ReturnType<typeof useT> }) {
  const isNew = !base;
  const id = useMemo(() => base?.id ?? newId(), [base]);
  const builtIn = isBuiltinWorkoutId(id);
  const translatedName = base?.nameKey ? t(base.nameKey) : undefined;
  const exercisesById = useExercisesById();
  const overridden = useLibrary((s) => isBuiltinOverridden(id, s));

  const [initial] = useState(() => workoutDraft(base, translatedName));
  const [draft, setDraft] = useState<WorkoutDraft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);
  useFlip(listRef, [draft.items.map((i) => i.key).join('|')]);

  const storedName = useLibrary((s) => s.workouts.find((w) => w.id === id)?.name);
  // Same rule as buildWorkout's keepTranslated: the untouched translated FBW name is no override.
  const errors = workoutErrors(draft, (n) => isWorkoutNameTaken(n, id), {
    builtIn,
    translatedName: (storedName ?? base?.name) === undefined ? translatedName : undefined,
  });
  const dirty = workoutFingerprint(draft) !== workoutFingerprint(initial);
  const showNameError = errors.name && (submitted || nameTouched) && (errors.name !== 'nameRequired' || submitted);

  const update = (patch: Partial<WorkoutDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const updateItem = (key: string, patch: Partial<ItemDraft>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) }));
  const move = (from: number, to: number) => setDraft((d) => ({ ...d, items: moveItem(d.items, from, to) }));
  const removeItem = (key: string) => setDraft((d) => ({ ...d, items: removeItems(d.items, (it) => it.key === key) }));

  const addExercise = (ex: Exercise) => {
    const item = itemDraft(itemFromExercise(ex));
    setDraft((d) => ({ ...d, items: [...d.items, item] }));
    setLastAdded(item.key);
    setPickerOpen(false);
    showToast(t('config.picker.added', { name: exerciseName(ex, t) }), { tone: 'success', durationMs: 1800 });
    // Bring the new item into view once it is rendered.
    setTimeout(() => {
      document.querySelector(`[data-flip="${item.key}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 280);
  };

  const leave = () => (dirty ? setDialog('discard') : nav.back());
  // System back on a dirty form asks too (same as the in-app back button).
  useBackGuard(() => {
    if (!dirty || dialog !== null) return false;
    setDialog('discard');
    return true;
  });

  const save = () => {
    setSubmitted(true);
    if (hasWorkoutErrors(errors)) {
      shake(saveRef.current);
      const firstInvalid = document.querySelector<HTMLElement>('.cfg [aria-invalid="true"], .cfg .cfg-error');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstInvalid instanceof HTMLInputElement) firstInvalid.focus({ preventScroll: true });
      return;
    }
    if (dirty || isNew) {
      const current = getWorkout(id);
      useLibrary.getState().saveWorkout(buildWorkout(id, draft, current ?? base, translatedName));
      showToast(t('config.form.saved'), { tone: 'success' });
    }
    useConfigUi.getState().highlight(id);
    nav.back();
  };

  const onDialogConfirm = () => {
    const name = base ? workoutName(base, t) : '';
    if (dialog === 'delete') {
      useLibrary.getState().deleteWorkout(id);
      showToast(t('config.workouts.deleted', { name }));
    } else if (dialog === 'restore') {
      useLibrary.getState().restoreBuiltin(id);
      useConfigUi.getState().highlight(id);
      showToast(t('config.workouts.restored', { name: translatedName ?? name }), { tone: 'success' });
    }
    setDialog(null);
    nav.back();
  };

  const totalSets = draft.items.reduce((n, i) => n + i.sets, 0);

  return (
    <div className="screen cfg">
      <ScreenHeader
        title={isNew ? t('config.workout.newTitle') : t('config.workout.editTitle')}
        eyebrow={base ? workoutName(base, t) : t('config.title')}
        onBack={leave}
      />
      <div className="screen-body cfg-body">
        <div className="stack-lg stagger">
          <TextField
            label={t('config.form.name')}
            value={draft.name}
            onChange={(name) => {
              update({ name });
              setNameTouched(true);
            }}
            placeholder={translatedName ?? t('config.workout.namePlaceholder')}
            maxLength={LIMITS.workoutNameMax}
            error={showNameError ? t(`config.error.${errors.name}`, { max: LIMITS.workoutNameMax }) : null}
            hint={builtIn && translatedName ? t('config.workout.nameBuiltinHint', { name: translatedName }) : undefined}
            autoFocus={isNew}
          />

          <div className="cfg-field">
            <span className="cfg-label">{t('config.workout.mode')}</span>
            <Segmented<WorkoutMode>
              label={t('config.workout.mode')}
              value={draft.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: 'straight', label: t('common.mode.straight'), icon: <Icon name="list" size={18} /> },
                { value: 'circuit', label: t('common.mode.circuit'), icon: <Icon name="repeat" size={18} /> },
              ]}
            />
            <p className="cfg-hint fade-in" key={draft.mode}>
              {t(`config.workout.mode.${draft.mode}Hint`)}
            </p>
          </div>

          <section className="cfg-field" aria-labelledby="cfg-items-title">
            <div className="row-between">
              <h2 id="cfg-items-title" className="cfg-label">
                {t('config.workout.items')}
              </h2>
              {draft.items.length > 0 && (
                <span className="muted tabular cfg-summary">
                  {t('config.workout.summary', {
                    exercises: t('common.count.exercises', { count: draft.items.length }),
                    sets: t('common.count.sets', { count: totalSets }),
                  })}
                </span>
              )}
            </div>

            {draft.items.length === 0 && (
              <div className={cx('cfg-empty cfg-empty--items', submitted && 'is-invalid')}>
                <Icon name="dumbbell" size={28} />
                <p>{t('config.workout.emptyHint')}</p>
              </div>
            )}

            <div className="cfg-items" ref={listRef}>
              {draft.items.map((item, idx) => {
                const ex = exercisesById[item.exerciseId];
                return (
                  <ItemCard
                    key={item.key}
                    item={item}
                    exercise={ex}
                    index={idx}
                    count={draft.items.length}
                    fresh={item.key === lastAdded}
                    errors={errors.items[item.key] ?? []}
                    onChange={(patch) => updateItem(item.key, patch)}
                    onMove={(dir) => move(idx, idx + dir)}
                    onRemove={() => removeItem(item.key)}
                    mode={draft.mode}
                    prevLinked={idx > 0 && !!draft.items[idx - 1]?.linkNext}
                    defaultRestSec={(base?.rest ?? defaultRest()).straight.betweenSetsSec}
                    t={t}
                  />
                );
              })}
            </div>

            {submitted && errors.noItems && <FieldError>{t('config.error.noItems')}</FieldError>}

            <Button variant="secondary" block icon="plus" onClick={() => setPickerOpen(true)} className="cfg-add">
              {t('config.workout.addExercise')}
            </Button>
          </section>

          {!isNew && (builtIn ? overridden : true) && (
            <div className="cfg-danger-zone">
              {builtIn ? (
                <Button variant="ghost" block icon="repeat" onClick={() => setDialog('restore')}>
                  {t('config.workouts.restore')}
                </Button>
              ) : (
                <Button variant="ghost" block icon="trash" className="cfg-btn-danger" onClick={() => setDialog('delete')}>
                  {t('config.workout.delete')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="action-bar cfg-save-bar" ref={saveRef}>
        {submitted && hasWorkoutErrors(errors) && (
          <p className="cfg-save-bar__msg text-danger fade-in" role="status">
            {t('config.form.fixErrors')}
          </p>
        )}
        <Button size="lg" block icon="check" onClick={save}>
          {t('common.action.save')}
        </Button>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercise} />

      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog === 'discard'
            ? t('config.form.discardTitle')
            : dialog === 'delete'
              ? t('config.workouts.deleteTitle', { name: base ? workoutName(base, t) : '' })
              : t('config.workouts.restoreTitle', { name: translatedName ?? '' })
        }
        message={
          dialog === 'discard'
            ? t('config.form.discardMessage')
            : dialog === 'delete'
              ? deleteWorkoutMessage(id, t)
              : t('config.workouts.restoreMessage')
        }
        confirmLabel={
          dialog === 'discard'
            ? t('config.form.discard')
            : dialog === 'delete'
              ? t('common.action.delete')
              : t('config.workouts.restore')
        }
        tone="danger"
        onConfirm={dialog === 'discard' ? () => (setDialog(null), nav.back()) : onDialogConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}

function ItemCard({
  item,
  exercise,
  index,
  count,
  fresh,
  errors,
  onChange,
  onMove,
  onRemove,
  mode,
  prevLinked,
  defaultRestSec,
  t,
}: {
  mode: WorkoutMode;
  /** the previous item is linked to this one (this item is inside a group) */
  prevLinked: boolean;
  /** workout default rest between sets (shown when the item has no own rest) */
  defaultRestSec: number;
  item: ItemDraft;
  exercise: Exercise | undefined;
  index: number;
  count: number;
  fresh: boolean;
  errors: Parameters<typeof TargetFields>[0]['errors'];
  onChange: (patch: Partial<ItemDraft>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  t: ReturnType<typeof useT>;
}) {
  const name = exercise ? exerciseName(exercise, t) : item.exerciseId;
  const meta = exercise ? CATEGORIES[exercise.category] : undefined;
  const per = exercise?.unilateral
    ? t(
        meta?.sideUnit === 'leg'
          ? 'common.target.perLeg'
          : meta?.sideUnit === 'arm'
            ? 'common.target.perArm'
            : 'common.target.perSide',
      )
    : null;
  return (
    <article
      data-flip={item.key}
      className={cx('card cfg-item', fresh && 'cfg-item--fresh', errors.length > 0 && 'is-invalid')}
      style={{ '--row-accent': meta ? `var(${meta.cssVar})` : 'var(--c-border-strong)' } as CSSProperties}
      aria-label={t('config.workout.itemNo', { no: index + 1 })}
    >
      <header className="cfg-item__head">
        <span className="cfg-item__no tabular" aria-hidden="true">
          {index + 1}
        </span>
        <div className="grow">
          <h3 className="cfg-item__name">{name}</h3>
          <p className="cfg-item__sub">
            {meta && <span style={{ color: `var(${meta.cssVar})` }}>{t(meta.labelKey)}</span>}
            <span className="cfg-item__type">
              <TypeIcon type={item.target.type} />
              {t(`config.form.type.${item.target.type}`)}
              {per && ` · ${per}`}
            </span>
          </p>
        </div>
        <div className="cfg-item__order">
          <IconButton
            icon="up"
            label={`${t('config.workout.moveUp')}: ${name}`}
            onClick={() => onMove(-1)}
            disabled={index === 0}
          />
          <IconButton
            icon="down"
            label={`${t('config.workout.moveDown')}: ${name}`}
            onClick={() => onMove(1)}
            disabled={index === count - 1}
          />
        </div>
      </header>
      <Stepper
        label={t('config.form.sets')}
        value={item.sets}
        min={LIMITS.setsMin}
        max={LIMITS.setsMax}
        onChange={(sets) => onChange({ sets })}
      />
      <TargetFields draft={item.target} onChange={(target) => onChange({ target })} errors={errors} showHint={false} />
      {mode === 'straight' && (
        <div className="cfg-item__flow">
          {index < count - 1 && (
            <Switch
              label={t('config.workout.linkNext')}
              hint={t('config.workout.linkNextHint')}
              checked={!!item.linkNext}
              onChange={(linkNext) => onChange({ linkNext })}
            />
          )}
          {item.linkNext && index < count - 1 ? (
            <p className="cfg-item__linked">
              <Icon name="forward" size={14} /> {t('config.workout.noRestLinked')}
            </p>
          ) : (
            <Stepper
              label={t(prevLinked ? 'config.workout.restAfterRound' : 'config.workout.restAfterSet')}
              value={item.restSec ?? defaultRestSec}
              min={LIMITS.restMinSec}
              max={LIMITS.restMaxSec}
              step={15}
              format={(v) => (v === 0 ? t('preview.rest.none') : formatClock(v))}
              onChange={(restSec) => onChange({ restSec })}
            />
          )}
        </div>
      )}
      <button type="button" className="cfg-item__remove press" onClick={onRemove}>
        <Icon name="trash" size={16} />
        {t('config.workout.removeItem')}
      </button>
    </article>
  );
}
