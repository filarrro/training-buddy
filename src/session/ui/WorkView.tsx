import { CategoryBadge, Icon, ProgressRing, cx } from '../../components';
import { formatClock, formatRange, formatTimeRangeHint, remainingSec } from '../../domain/format';
import type { WorkStep } from '../../domain/types';
import { useT } from '../../i18n';
import { PREPARE_MS, exerciseOf, isPaused, peekNext, remainingMs, targetOf } from '../engine';
import type { EngineSession } from '../engine';
import { positionText, sideText, stepName, stepNote } from './helpers';

const RING = 248;

interface Props {
  session: EngineSession;
  step: WorkStep;
  now: number;
}

/** Exercise step (FR10–FR13): position, badge, big name, target or time ring. */
export function WorkView({ session, step, now }: Props) {
  const t = useT();
  const ex = exerciseOf(session, step);
  const target = targetOf(session, step);
  const side = sideText(session, step, t);
  const note = stepNote(session, step, t);
  const name = stepName(session, step, t);
  const status = session.statuses[session.index];
  const nextIdx = peekNext(session);
  const next = nextIdx >= 0 ? (session.steps[nextIdx] as WorkStep) : null;
  // One-sided exercises: left and right share name and set → the side tells them apart (FR11).
  const nextSide = next ? sideText(session, next, t) : null;

  return (
    <div className="sx-work">
      <div className="sx-hero stagger">
        <div className="sx-position tabular">{positionText(step, t)}</div>
        <div className="row sx-badges">
          {ex && <CategoryBadge category={ex.category} size="md" />}
          {side && (
            <span className={cx('sx-side', step.side === 'right' && 'sx-side--right')}>
              <Icon name={step.side === 'left' ? 'back' : 'forward'} size={16} />
              {side}
            </span>
          )}
        </div>
        <h1 className={cx('sx-name', name.length > 26 && 'sx-name--long')}>{name}</h1>
        {note && <p className="sx-note">{note}</p>}
        {status !== 'todo' && (
          <span className={cx('sx-chip', status === 'done' ? 'sx-chip--done' : 'sx-chip--skipped')}>
            <Icon name={status === 'done' ? 'check' : 'skip'} size={14} />
            {t(status === 'done' ? 'session.doneBefore' : 'session.skippedBefore')}
          </span>
        )}
      </div>

      {target.type === 'reps' ? (
        <div className="sx-target scale-in">
          <div className="eyebrow muted">{t('session.target')}</div>
          <div className="sx-target__value">
            <span className="display-num sx-target__num">{formatRange(target.min, target.max)}</span>
            <span className="sx-target__unit">{t('session.repsUnit')}</span>
          </div>
        </div>
      ) : (
        <TimeTarget session={session} targetSec={target.targetSec} hint={formatTimeRangeHint(target, t)} now={now} />
      )}

      <div className="sx-upnext fade-in">
        {next ? (
          <>
            <span className="sx-upnext__label">{t('session.upNext')}</span>
            <span className="sx-upnext__name">{stepName(session, next, t)}</span>
            <span className="sx-upnext__meta tabular">{positionText(next, t)}</span>
            {nextSide && <span className="sx-side sx-side--sm sx-upnext__side">{nextSide}</span>}
          </>
        ) : (
          <span className="sx-upnext__label sx-upnext__label--last">
            <Icon name="flag" size={16} /> {t('session.lastStep')}
          </span>
        )}
      </div>
    </div>
  );
}

function TimeTarget({
  session,
  targetSec,
  hint,
  now,
}: {
  session: EngineSession;
  targetSec: number;
  hint: string | null;
  now: number;
}) {
  const t = useT();
  const phase = session.phase;
  const left = remainingMs(session, now);
  const paused = isPaused(session);

  let progress = 1;
  let center;
  if (phase === 'prepare') {
    const n = Math.max(1, remainingSec(left));
    progress = left / PREPARE_MS;
    center = (
      <>
        <span className="sx-ring-label sx-ring-label--work">{t(paused ? 'session.timer.paused' : 'session.timer.getReady')}</span>
        <span key={n} className="sx-prep-num display-num pop">
          {n}
        </span>
      </>
    );
  } else if (phase === 'countdown') {
    progress = left / (targetSec * 1000);
    const sec = remainingSec(left);
    center = (
      <>
        <span className="sx-ring-label sx-ring-label--work">{t(paused ? 'session.timer.paused' : 'session.timer.go')}</span>
        <span className={cx('sx-clock display-num', sec <= 3 && !paused && 'sx-clock--final')} key={sec <= 3 ? sec : 'c'}>
          {formatClock(sec)}
        </span>
      </>
    );
  } else if (phase === 'countdownDone') {
    progress = 1;
    center = (
      <>
        <span className="sx-timeup display-num pop">{t('session.timer.timeUp')}</span>
        <span className="sx-ring-label">{t('session.timer.timeUpHint')}</span>
      </>
    );
  } else {
    center = (
      <>
        <span className="sx-ring-label">{t('session.target')}</span>
        <span className="sx-clock display-num">{formatClock(targetSec)}</span>
        {hint && <span className="sx-ring-hint">{hint}</span>}
      </>
    );
  }

  return (
    <div className={cx('sx-ringwrap scale-in', paused && 'is-paused', phase === 'countdownDone' && 'is-done')}>
      <ProgressRing
        progress={progress}
        size={RING}
        stroke={14}
        tone={phase === 'countdownDone' ? 'success' : 'work'}
        className="sx-ring"
        label={
          phase === 'countdown' || phase === 'prepare'
            ? t('session.timer.remaining', { time: formatClock(remainingSec(left)) })
            : undefined
        }
      >
        <div className="sx-ring-center">{center}</div>
      </ProgressRing>
      {phase === 'work' && <p className="sx-ring-tip muted">{t('session.timer.tapStart')}</p>}
    </div>
  );
}
