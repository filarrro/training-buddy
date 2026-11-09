import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { nav } from '../../app/nav';
import { Button, ConfirmDialog, IconButton, cx } from '../../components';
import { workoutName } from '../../domain/format';
import type { Plan } from '../../domain/types';
import { useT } from '../../i18n';
import { getPlanWorkouts, isBuiltinPlanOverridden, planName, useAllPlans, useLibrary } from '../../stores/library';
import { showToast } from '../../stores/toast';
import { useConfigUi } from './configUi';

/** Configurator tab: plans (groups of workouts). */
export function PlansTab({ highlightId }: { highlightId: string | null }) {
  const t = useT();
  const plans = useAllPlans();
  const lib = useLibrary(
    useShallow((s) => ({
      exercises: s.exercises,
      workouts: s.workouts,
      plans: s.plans,
      planLast: s.planLast,
    })),
  );
  const [confirm, setConfirm] = useState<{
    kind: 'delete' | 'restore';
    plan: Plan;
  } | null>(null);

  const duplicate = (p: Plan) => {
    const id = useLibrary.getState().duplicatePlan(p.id, t);
    if (!id) return;
    const copy = useLibrary.getState().plans.find((x) => x.id === id);
    useConfigUi.getState().highlight(id);
    showToast(t('config.workouts.duplicated', { name: copy ? planName(copy, t) : '' }), { tone: 'success' });
  };

  const onConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      useLibrary.getState().deletePlan(confirm.plan.id);
      showToast(t('config.plans.deleted', { name: planName(confirm.plan, t) }));
    } else {
      useLibrary.getState().restoreBuiltinPlan(confirm.plan.id);
      useConfigUi.getState().highlight(confirm.plan.id);
      showToast(
        t('config.workouts.restored', {
          name: planName({ ...confirm.plan, name: undefined }, t),
        }),
        { tone: 'success' },
      );
    }
    setConfirm(null);
  };

  return (
    <>
      <div className="screen-body cfg-body">
        <p className="cfg-hint fade-up">{t('config.plans.intro')}</p>
        <div className="stack stagger">
          {plans.map((p, i) => {
            const workouts = getPlanWorkouts(p, lib);
            const overridden = isBuiltinPlanOverridden(p.id, lib);
            const name = planName(p, t);
            return (
              <article
                key={p.id}
                className={cx('card cfg-row', highlightId === p.id && 'cfg-row--highlight')}
                style={{ '--i': i, '--row-accent': 'var(--c-work)' } as CSSProperties}
              >
                <button
                  type="button"
                  className="cfg-row__main press"
                  onClick={() => nav.go({ name: 'configPlan', planId: p.id })}
                  aria-label={`${t('common.action.edit')}: ${name}`}
                >
                  <div className="cfg-row__titles">
                    <h3 className="cfg-row__name">{name}</h3>
                    <div className="cfg-row__tags">
                      {p.builtIn && <span className="cfg-tag">{t('common.builtIn')}</span>}
                      {overridden && <span className="cfg-tag cfg-tag--work">{t('config.workouts.modified')}</span>}
                    </div>
                  </div>
                  <p className={cx('cfg-row__meta', workouts.length === 0 && 'text-danger')}>
                    {workouts.length === 0 ? t('start.plan.empty') : workouts.map((w) => workoutName(w, t)).join(' · ')}
                  </p>
                </button>
                <div className="cfg-row__actions">
                  {p.builtIn && overridden && (
                    <IconButton
                      icon="repeat"
                      label={`${t('config.workouts.restore')}: ${name}`}
                      onClick={() => setConfirm({ kind: 'restore', plan: p })}
                    />
                  )}
                  <IconButton
                    icon="copy"
                    label={`${t('common.action.duplicate')}: ${name}`}
                    onClick={() => duplicate(p)}
                  />
                  {!p.builtIn && (
                    <IconButton
                      icon="trash"
                      label={`${t('common.action.delete')}: ${name}`}
                      onClick={() => setConfirm({ kind: 'delete', plan: p })}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="action-bar">
        <Button size="lg" block icon="plus" onClick={() => nav.go({ name: 'configPlan' })}>
          {t('config.plans.new')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm
            ? confirm.kind === 'delete'
              ? t('config.plans.deleteTitle', {
                  name: planName(confirm.plan, t),
                })
              : t('config.workouts.restoreTitle', {
                  name: planName({ ...confirm.plan, name: undefined }, t),
                })
            : ''
        }
        message={confirm?.kind === 'delete' ? t('config.plans.deleteMessage') : t('config.plans.restoreMessage')}
        confirmLabel={confirm?.kind === 'delete' ? t('common.action.delete') : t('config.workouts.restore')}
        tone="danger"
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
