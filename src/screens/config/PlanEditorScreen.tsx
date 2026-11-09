import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useBackGuard } from '../../app/backGuard';
import { nav } from '../../app/nav';
import { BottomSheet, Button, ConfirmDialog, Icon, IconButton, ScreenHeader, cx } from '../../components';
import { CATEGORIES, isBuiltinPlanId } from '../../domain/builtins';
import { workoutName } from '../../domain/format';
import type { Plan } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { useT } from '../../i18n';
import {
  getPlan,
  isBuiltinPlanOverridden,
  isPlanNameTaken,
  newId,
  planName,
  useAllWorkouts,
  useExercisesById,
  useLibrary,
} from '../../stores/library';
import { showToast } from '../../stores/toast';
import { useConfigUi } from './configUi';
import { FieldError, TextField } from './fields';
import { moveItem, nameError } from './forms';
import './config.css';

type Dialog = 'discard' | 'delete' | 'restore' | null;

/** Create / edit a plan: name + ordered workouts. planId undefined = new plan. */
export function PlanEditorScreen({ planId }: { planId?: string }) {
  const [base] = useState<Plan | undefined>(() => (planId ? getPlan(planId) : undefined));
  return <PlanEditor key={planId ?? 'new'} base={base} />;
}

function PlanEditor({ base }: { base: Plan | undefined }) {
  const t = useT();
  const isNew = !base;
  const id = useMemo(() => base?.id ?? newId(), [base]);
  const builtIn = isBuiltinPlanId(id);
  const translatedName = base?.nameKey ? t(base.nameKey) : undefined;
  const overridden = useLibrary((s) => isBuiltinPlanOverridden(id, s));
  const allWorkouts = useAllWorkouts();
  const byId = useExercisesById();
  const workoutsById = useMemo(() => new Map(allWorkouts.map((w) => [w.id, w])), [allWorkouts]);

  const initialName = base?.name ?? translatedName ?? '';
  const initialIds = base ? base.workoutIds.filter((w) => workoutsById.has(w)) : [];
  const [name, setName] = useState(initialName);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [submitted, setSubmitted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const keepsTranslated = builtIn && (name.trim() === '' || (!base?.name && name.trim() === translatedName));
  const nameErr = nameError(name, LIMITS.planNameMax, keepsTranslated ? () => false : (n) => isPlanNameTaken(n, id), {
    allowEmpty: builtIn,
  });
  const noWorkouts = ids.length === 0;
  const dirty = name.trim() !== initialName.trim() || ids.join('|') !== initialIds.join('|');

  const leave = () => (dirty ? setDialog('discard') : nav.back());
  useBackGuard(() => {
    if (!dirty || dialog !== null) return false;
    setDialog('discard');
    return true;
  });

  const save = () => {
    setSubmitted(true);
    if (nameErr || noWorkouts) return;
    const plan: Plan = {
      id,
      builtIn,
      ...(builtIn && base?.nameKey ? { nameKey: base.nameKey } : {}),
      ...(keepsTranslated ? {} : { name: name.trim() }),
      workoutIds: ids,
    };
    if (dirty || isNew) {
      useLibrary.getState().savePlan(plan);
      showToast(t('config.form.saved'), { tone: 'success' });
    }
    useConfigUi.getState().highlight(id);
    nav.back();
  };

  const onDialogConfirm = () => {
    const shown = base ? planName(base, t) : '';
    if (dialog === 'delete') {
      useLibrary.getState().deletePlan(id);
      showToast(t('config.plans.deleted', { name: shown }));
    } else if (dialog === 'restore') {
      useLibrary.getState().restoreBuiltinPlan(id);
      useConfigUi.getState().highlight(id);
      showToast(t('config.workouts.restored', { name: translatedName ?? shown }), { tone: 'success' });
    }
    setDialog(null);
    nav.back();
  };

  return (
    <div className="screen cfg">
      <ScreenHeader
        title={isNew ? t('config.plan.newTitle') : t('config.plan.editTitle')}
        eyebrow={base ? planName(base, t) : t('config.title')}
        onBack={leave}
      />
      <div className="screen-body cfg-body">
        <div className="stack-lg stagger">
          <TextField
            label={t('config.form.name')}
            value={name}
            onChange={setName}
            placeholder={translatedName ?? t('config.plan.namePlaceholder')}
            maxLength={LIMITS.planNameMax}
            error={submitted && nameErr ? t(`config.error.${nameErr}`, { max: LIMITS.planNameMax }) : null}
            autoFocus={isNew}
          />

          <section className="cfg-field" aria-labelledby="cfg-plan-items">
            <h2 id="cfg-plan-items" className="cfg-label">
              {t('config.plan.workouts')}
            </h2>
            <p className="cfg-hint">{t('config.plan.orderHint')}</p>
            {ids.length === 0 && (
              <div className={cx('cfg-empty cfg-empty--items', submitted && 'is-invalid')}>
                <Icon name="flag" size={28} />
                <p>{t('config.plan.emptyHint')}</p>
              </div>
            )}
            <div className="stack">
              {ids.map((wid, idx) => {
                const w = workoutsById.get(wid)!;
                const cat = w.items.map((i) => byId[i.exerciseId]?.category).find(Boolean);
                const label = workoutName(w, t);
                return (
                  <article
                    key={wid}
                    className="card cfg-plan-item"
                    style={
                      {
                        '--row-accent': cat ? `var(${CATEGORIES[cat].cssVar})` : 'var(--c-border-strong)',
                      } as CSSProperties
                    }
                  >
                    <span className="cfg-item__no tabular" aria-hidden="true">
                      {idx + 1}
                    </span>
                    <span className="cfg-plan-item__name grow">{label}</span>
                    <IconButton
                      icon="up"
                      label={`${t('config.workout.moveUp')}: ${label}`}
                      disabled={idx === 0}
                      onClick={() => setIds((x) => moveItem(x, idx, idx - 1))}
                    />
                    <IconButton
                      icon="down"
                      label={`${t('config.workout.moveDown')}: ${label}`}
                      disabled={idx === ids.length - 1}
                      onClick={() => setIds((x) => moveItem(x, idx, idx + 1))}
                    />
                    <IconButton
                      icon="trash"
                      label={`${t('config.plan.remove')}: ${label}`}
                      onClick={() => setIds((x) => x.filter((v) => v !== wid))}
                    />
                  </article>
                );
              })}
            </div>
            {submitted && noWorkouts && <FieldError>{t('config.plan.errorEmpty')}</FieldError>}
            <Button variant="secondary" block icon="plus" onClick={() => setPickerOpen(true)} className="cfg-add">
              {t('config.plan.addWorkout')}
            </Button>
          </section>

          {!isNew && (builtIn ? overridden : true) && (
            <div className="cfg-danger-zone">
              {builtIn ? (
                <Button variant="ghost" block icon="repeat" onClick={() => setDialog('restore')}>
                  {t('config.workouts.restore')}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  block
                  icon="trash"
                  className="cfg-btn-danger"
                  onClick={() => setDialog('delete')}
                >
                  {t('config.plan.delete')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="action-bar cfg-save-bar">
        <Button size="lg" block icon="check" onClick={save}>
          {t('common.action.save')}
        </Button>
      </div>

      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)} title={t('config.plan.addWorkout')}>
        <div className="stack cfg-plan-picker">
          {allWorkouts.map((w) => {
            const added = ids.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                className={cx('cfg-plan-pick press', added && 'is-added')}
                disabled={added}
                onClick={() => {
                  setIds((x) => [...x, w.id]);
                  setPickerOpen(false);
                }}
              >
                <span className="grow">{workoutName(w, t)}</span>
                <span className="muted small">
                  {added ? t('config.plan.added') : t('common.count.exercises', { count: w.items.length })}
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={dialog !== null}
        title={
          dialog === 'discard'
            ? t('config.form.discardTitle')
            : dialog === 'delete'
              ? t('config.plans.deleteTitle', {
                  name: base ? planName(base, t) : '',
                })
              : t('config.workouts.restoreTitle', {
                  name: translatedName ?? '',
                })
        }
        message={
          dialog === 'discard'
            ? t('config.form.discardMessage')
            : dialog === 'delete'
              ? t('config.plans.deleteMessage')
              : t('config.plans.restoreMessage')
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
