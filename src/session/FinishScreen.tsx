import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { nav } from '../app/nav';
import { Button, Icon, cx } from '../components';
import { formatClock, workoutName } from '../domain/format';
import { useT } from '../i18n';
import { summarize } from './engine';
import { sessionActions, useSessionStore } from './store';
import { prefersReducedMotion } from './ui/helpers';
import './session.css';

/** Sessions that already got their confetti (StrictMode / re-mount safe). */
const celebrated = new Set<string>();

const COLORS = ['#FF5A1F', '#4F8CFF', '#A06BFF', '#F5B83D', '#2DD4BF', '#F472B6', '#A3E635', '#F3F5F9'];

async function fireConfetti(): Promise<void> {
  const { default: confetti } = await import('canvas-confetti');
  if (prefersReducedMotion()) {
    // Minimal: one small, short, slow burst.
    void confetti({ particleCount: 24, spread: 60, startVelocity: 18, ticks: 80, gravity: 1.4, origin: { y: 0.35 }, colors: COLORS });
    return;
  }
  void confetti({ particleCount: 120, spread: 90, startVelocity: 45, origin: { y: 0.35 }, colors: COLORS, zIndex: 80 });
  const end = Date.now() + 1200;
  const frame = () => {
    void confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: COLORS, zIndex: 80 });
    void confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: COLORS, zIndex: 80 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** FR20 (completed: confetti) / FR21 (ended early: same summary, no confetti). */
export function FinishScreen() {
  const t = useT();
  const session = useSessionStore((s) => s.session);
  const summary = useMemo(() => (session ? summarize(session) : null), [session]);
  const completed = !!session && !session.endedEarly;

  useEffect(() => {
    if (!session || session.endedEarly || celebrated.has(session.id)) return;
    celebrated.add(session.id);
    fireConfetti().catch(() => {});
  }, [session]);

  const home = () => {
    nav.reset();
    sessionActions.clear();
  };

  return (
    <div className={cx('screen fx', completed ? 'fx--completed' : 'fx--early')}>
      <div className="fx-glow" aria-hidden="true" />
      <div className="screen-body fx-body">
        <div className="fx-hero">
          <div className="fx-medal scale-in" aria-hidden="true">
            <span className="fx-medal__ring" />
            <Icon name={completed ? 'trophy' : 'flag'} size={44} strokeWidth={2.2} />
          </div>
          <h1 className="fx-title fade-up">
            {t(completed ? 'session.finish.title.completed' : 'session.finish.title.early')}
          </h1>
          <p className="fx-sub fade-up">
            {t(completed ? 'session.finish.subtitle.completed' : 'session.finish.subtitle.early')}
          </p>
        </div>

        {session && summary && (
          <section className="fx-card fade-up" aria-label={t('session.finish.summary')}>
            <div className="fx-card__head">
              <span className="eyebrow muted">{t('session.finish.summary')}</span>
              <span className="fx-card__name">{workoutName(session.workout, t)}</span>
            </div>
            <div className="fx-stats stagger">
              <Stat icon="timer" label={t('session.finish.duration')} value={formatClock(summary.durationSec)} accent="work" big />
              <Stat
                icon="dumbbell"
                label={t('session.finish.exercises')}
                value={t('session.finish.of', { n: summary.exercisesDone, total: summary.exercisesTotal })}
              />
              <Stat icon="check" label={t('session.finish.setsDone')} value={String(summary.setsDone)} accent="success" />
              <Stat icon="skip" label={t('session.finish.setsSkipped')} value={String(summary.setsSkipped)} />
              {summary.setsLeft > 0 && (
                <Stat icon="close" label={t('session.finish.setsLeft')} value={String(summary.setsLeft)} />
              )}
            </div>
          </section>
        )}
      </div>
      <div className="action-bar">
        <Button variant={completed ? 'success' : 'primary'} size="lg" block icon="back" onClick={home}>
          {t('session.finish.home')}
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  big,
}: {
  icon: 'timer' | 'dumbbell' | 'check' | 'skip' | 'close';
  label: string;
  value: ReactNode;
  accent?: 'work' | 'success';
  big?: boolean;
}) {
  return (
    <div className={cx('fx-stat', accent && `fx-stat--${accent}`, big && 'fx-stat--big')}>
      <span className="fx-stat__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="fx-stat__label">{label}</span>
      <span className="fx-stat__value tabular">{value}</span>
    </div>
  );
}
