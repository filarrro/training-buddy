import { CategoryBadge, Icon, ProgressRing } from '../../components';
import { formatClock, formatOvertime, remainingSec } from '../../domain/format';
import type { RestStep, WorkStep } from '../../domain/types';
import { useT } from '../../i18n';
import { exerciseOf, overtimeMs, remainingMs } from '../engine';
import type { EngineSession } from '../engine';
import { positionText, restReasonText, sideText, stepName, stepTargetText } from './helpers';

const RING = 248;

interface Props {
  session: EngineSession;
  rest: RestStep;
  now: number;
}

/** Rest (FR18): teal world, big mm:ss with ring, rest type, "Up next" card; overtime after the end. */
export function RestView({ session, rest, now }: Props) {
  const t = useT();
  const ended = session.phase === 'restDone';
  const left = remainingMs(session, now);
  const sec = remainingSec(left);
  const next = session.steps[session.index + 1] as WorkStep | undefined;

  return (
    <div className="sx-rest">
      <div className="sx-rest__head">
        {ended ? (
          <h1 className="sx-rest__title sx-rest__title--ended pop">{t('session.rest.ended')}</h1>
        ) : (
          <>
            <div className="eyebrow sx-rest__eyebrow">{t('session.rest.title')}</div>
            <h1 className="sx-rest__title fade-up">{restReasonText(session, rest, t)}</h1>
          </>
        )}
      </div>

      <div className="sx-ringwrap scale-in">
        <ProgressRing
          progress={ended ? 1 : left / (rest.durationSec * 1000)}
          size={RING}
          stroke={14}
          tone="rest"
          className="sx-ring"
          label={ended ? t('session.rest.ended') : t('session.rest.remaining', { time: formatClock(sec) })}
        >
          <div className="sx-ring-center">
            {ended ? (
              <>
                <span className="sx-clock sx-clock--over display-num">
                  {formatOvertime(Math.floor(overtimeMs(session, now) / 1000))}
                </span>
                <span className="sx-ring-label sx-ring-label--rest">{t('session.rest.overtime')}</span>
              </>
            ) : (
              <>
                <span className="sx-clock display-num">{formatClock(sec)}</span>
                <span className="sx-ring-label sx-ring-label--rest">{t('session.rest.breathe')}</span>
              </>
            )}
          </div>
        </ProgressRing>
      </div>

      {next && next.kind === 'work' && <NextCard session={session} step={next} />}
    </div>
  );
}

function NextCard({ session, step }: { session: EngineSession; step: WorkStep }) {
  const t = useT();
  const ex = exerciseOf(session, step);
  const side = sideText(session, step, t);
  return (
    <section className="sx-next slide-in-next" aria-label={t('session.rest.next')}>
      <div className="sx-next__label">
        <Icon name="forward" size={16} />
        {t('session.rest.next')}
      </div>
      <div className="sx-next__body">
        <div className="sx-next__main">
          <div className="sx-next__name">{stepName(session, step, t)}</div>
          <div className="sx-next__meta tabular">{positionText(step, t)}</div>
          <div className="row sx-next__chips">
            <span className="sx-next__target tabular">{stepTargetText(session, step, t)}</span>
            {side && <span className="sx-side sx-side--sm">{side}</span>}
          </div>
        </div>
        {ex && <CategoryBadge category={ex.category} size="dot" />}
      </div>
    </section>
  );
}
