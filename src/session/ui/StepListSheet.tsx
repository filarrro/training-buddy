import { useEffect, useRef } from 'react';
import { BottomSheet, CategoryBadge, Icon, cx } from '../../components';
import type { SessionStepStatus, WorkStep } from '../../domain/types';
import { exerciseName } from '../../domain/format';
import { useT } from '../../i18n';
import { exerciseOf, focusIndex } from '../engine';
import type { EngineSession } from '../engine';
import { groupStart, sideText, stepName, stepTargetText } from './helpers';

interface Props {
  open: boolean;
  session: EngineSession;
  onClose: () => void;
  onPick: (index: number) => void;
}

interface Group {
  key: string;
  title: string;
  rows: { index: number; step: WorkStep }[];
}

/** FR15: every work step with its status; tap jumps there (no confirm). */
export function StepListSheet({ open, session, onClose, onPick }: Props) {
  const t = useT();
  const currentRef = useRef<HTMLButtonElement>(null);
  const focus = focusIndex(session);
  const circuit = session.workout.mode === 'circuit';

  const groups: Group[] = [];
  session.steps.forEach((st, index) => {
    if (st.kind !== 'work') return;
    const start = st.group ? groupStart(session, st.itemIndex) : st.itemIndex;
    const key = circuit ? `r${st.round}` : st.group ? `g${start}` : `e${st.itemIndex}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      let title: string;
      if (circuit) title = t('session.list.round', { n: st.round ?? 1 });
      else if (st.group) {
        const names: string[] = [];
        for (let k = start; k < session.workout.items.length; k++) {
          const ex = session.exercises.find((e) => e.id === session.workout.items[k]!.exerciseId);
          if (ex) names.push(exerciseName(ex, t));
          if (!session.workout.items[k]!.linkNext) break;
        }
        title = t(st.group === 'superset' ? 'session.list.superset' : 'session.list.circuitBlock', {
          names: names.join(' + '),
        });
      } else title = stepName(session, st, t);
      g = { key, title, rows: [] };
      groups.push(g);
    }
    g.rows.push({ index, step: st });
  });

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => currentRef.current?.scrollIntoView?.({ block: 'center' }), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title={t('session.stepList')}>
      <p className="muted sx-list-hint">{t('session.list.hint')}</p>
      <div className="sx-list">
        {groups.map((g) => (
          <section key={g.key} className="sx-list__group">
            <h3 className="sx-list__title eyebrow">{g.title}</h3>
            <ul className="sx-list__rows">
              {g.rows.map(({ index, step }) => {
                const isCurrent = index === focus;
                const status = session.statuses[index] ?? 'todo';
                const ex = exerciseOf(session, step);
                const side = sideText(session, step, t);
                const title = circuit
                  ? stepName(session, step, t)
                  : step.group
                    ? `${stepName(session, step, t)} · ${t('session.list.set', { n: step.round ?? step.set })}`
                    : t('session.list.set', { n: step.set });
                const statusLabel = t(`session.list.status.${isCurrent ? 'current' : status}`);
                return (
                  <li key={index}>
                    <button
                      type="button"
                      ref={isCurrent ? currentRef : undefined}
                      className={cx('sx-row press', `sx-row--${status}`, isCurrent && 'is-current')}
                      aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => onPick(index)}
                    >
                      <StatusIcon status={status} current={isCurrent} />
                      <span className="sx-row__text">
                        <span className="sx-row__title">
                          {title}
                          {side && <span className="sx-row__side"> · {side}</span>}
                        </span>
                        <span className="sx-row__sub tabular">{stepTargetText(session, step, t)}</span>
                      </span>
                      {(circuit || step.group) && ex && <CategoryBadge category={ex.category} size="dot" />}
                      <span className="sx-row__status">{statusLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
}

function StatusIcon({ status, current }: { status: SessionStepStatus; current: boolean }) {
  if (current) return <span className="sx-status sx-status--current" aria-hidden="true" />;
  if (status === 'done')
    return (
      <span className="sx-status sx-status--done" aria-hidden="true">
        <Icon name="check" size={16} strokeWidth={3} />
      </span>
    );
  if (status === 'skipped')
    return (
      <span className="sx-status sx-status--skipped" aria-hidden="true">
        <Icon name="skip" size={14} />
      </span>
    );
  return <span className="sx-status sx-status--todo" aria-hidden="true" />;
}
