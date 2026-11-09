import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { nav } from '../app/nav';
import { BottomSheet, Button, ConfirmDialog, Icon, IconButton, ProgressBar, cx } from '../components';
import { CATEGORIES } from '../domain/builtins';
import { formatClock } from '../domain/format';
import type { WorkStep } from '../domain/types';
import { useT } from '../i18n';
import { useSettings } from '../stores/settings';
import { canGoBack, currentRest, currentStep, exerciseOf, isPaused, isResting, peekNext, progress } from './engine';
import type { EngineSession } from './engine';
import { clearExitConfirm, sessionActions, useSessionStore } from './store';
import { RestView } from './ui/RestView';
import { StepListSheet } from './ui/StepListSheet';
import { WorkView } from './ui/WorkView';
import { useResolvedTheme } from '../app/theme';
import { useNow } from './ui/helpers';
import { useSessionSignals } from './useSessionSignals';
import { useWakeLock } from './wakeLock';
import './session.css';

export function SessionScreen() {
  const t = useT();
  const session = useSessionStore((s) => s.session);
  const exitRequested = useSessionStore((s) => s.exitConfirmRequested);
  const keepScreenOn = useSettings((s) => s.keepScreenOn);
  const finished = session?.finishedAt !== undefined;

  useWakeLock(!!session && !finished && keepScreenOn);
  useSessionSignals();

  useEffect(() => {
    sessionActions.begin();
  }, []);

  useEffect(() => {
    if (finished) nav.replace({ name: 'finish' });
  }, [finished]);

  if (!session) {
    return (
      <div className="screen sx-empty">
        <div className="screen-body">
          <p className="muted">{t('session.empty')}</p>
          <Button onClick={() => nav.reset()}>{t('session.finish.home')}</Button>
        </div>
      </div>
    );
  }
  return <ActiveSessionView session={session} exitRequested={exitRequested} />;
}

function ActiveSessionView({ session, exitRequested }: { session: EngineSession; exitRequested: boolean }) {
  const t = useT();
  const timerRunning = session.endsAt !== undefined;
  const now = useNow(timerRunning ? 200 : 1000);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [burst, setBurst] = useState(0);

  const resting = isResting(session);
  const step = currentStep(session);
  const rest = currentRest(session);
  const prog = progress(session);
  const phase = session.phase;
  const pulse = phase === 'restDone' ? 'rest' : phase === 'countdownDone' ? 'work' : null;

  // Slide direction of the step view: backwards when the current step moved up the list.
  const viewKey = `${resting ? 'rest' : 'work'}-${session.index}`;
  const last = useRef({ key: viewKey, index: session.index, dir: 'fwd' as 'fwd' | 'back' });
  if (last.current.key !== viewKey) {
    last.current = { key: viewKey, index: session.index, dir: session.index < last.current.index ? 'back' : 'fwd' };
  }

  // Auto-clear the check burst.
  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => setBurst(0), 900);
    return () => window.clearTimeout(id);
  }, [burst]);

  const onDone = () => {
    if (sessionActions.complete('done')) setBurst(Date.now());
  };
  const closeEnd = () => {
    setEndOpen(false);
    clearExitConfirm();
  };

  const isTime = isTimeStep(session, step);

  // Colour world of the exercise screen follows the exercise category; during a rest the next
  // exercise's category is prepared so the screen lands in the right colour when the rest ends.
  const nextIdx = rest ? peekNext(session) : -1;
  const colourStep = step?.kind === 'work' ? step : nextIdx >= 0 ? session.steps[nextIdx] : undefined;
  const category = colourStep?.kind === 'work' ? exerciseOf(session, colourStep)?.category : undefined;
  const palette = category ? CATEGORIES[category].work : undefined;
  const theme = useResolvedTheme();
  const worldStyle = palette
    ? ({
        '--c-work': palette.from,
        '--c-work-2': palette.to,
        '--c-work-text': theme === 'light' ? palette.textLight : palette.text,
      } as CSSProperties)
    : undefined;

  return (
    <div className={cx('sx', resting ? 'sx--rest' : 'sx--work', pulse && 'sx--alert')} style={worldStyle}>
      <div className="sx-world sx-world--work" aria-hidden="true" />
      <div className="sx-world sx-world--rest" aria-hidden="true" />

      <header className="sx-top">
        <div className="sx-top__row">
          <div className="sx-elapsed tabular" aria-label={t('session.elapsed')} title={t('session.elapsed')}>
            <Icon name="timer" size={18} />
            {formatClock((now - session.startedAt) / 1000)}
          </div>
          <div className="sx-top__actions">
            <IconButton icon="list" label={t('session.stepList')} onClick={() => setListOpen(true)} />
            <IconButton icon="more" label={t('session.menu')} onClick={() => setMenuOpen(true)} />
          </div>
        </div>
        <div className="sx-progress">
          <ProgressBar
            value={prog.value}
            tone={resting ? 'rest' : 'work'}
            label={t('session.progressLabel')}
            valueText={t('session.progressValue', { done: prog.done + prog.skipped, count: prog.total })}
          />
          <span className="sx-progress__count tabular">
            {prog.done + prog.skipped}/{prog.total}
          </span>
        </div>
      </header>

      <div key={viewKey} className={cx('sx-view', last.current.dir === 'back' ? 'sx-view--back' : 'sx-view--fwd')}>
        {rest ? (
          <RestView session={session} rest={rest} now={now} />
        ) : step?.kind === 'work' ? (
          <WorkView session={session} step={step} now={now} />
        ) : null}
      </div>

      <div className="action-bar sx-actions">
        {rest ? (
          // FR14: "Back" stays available for the whole rest, also after it ended (restDone).
          <div className="row sx-actions__row">
            <Button variant="secondary" size="lg" icon="back" className="sx-btn-back" onClick={sessionActions.back}>
              {t('session.back')}
            </Button>
            {phase === 'restDone' ? (
              <Button
                variant="rest"
                size="lg"
                icon="forward"
                className="sx-btn-main breathe-rest"
                onClick={sessionActions.skipRest}
              >
                {t('session.rest.go')}
              </Button>
            ) : (
              <Button variant="rest" size="lg" icon="skip" className="sx-btn-main" onClick={sessionActions.skipRest}>
                {t('session.rest.skip')}
              </Button>
            )}
          </div>
        ) : isTime && phase === 'work' ? (
          <>
            <div className="row sx-actions__row sx-actions__row--sub">
              <Button variant="ghost" size="md" icon="back" disabled={!canGoBack(session)} onClick={sessionActions.back}>
                {t('session.back')}
              </Button>
              <Button variant="ghost" size="md" icon="check" onClick={onDone}>
                {t('session.done')}
              </Button>
            </div>
            <Button variant="primary" size="lg" block icon="play" onClick={sessionActions.startTimer}>
              {t('session.timer.start')}
            </Button>
          </>
        ) : (
          <div className="row sx-actions__row">
            {isTime && (phase === 'prepare' || phase === 'countdown') ? (
              <Button
                variant="secondary"
                size="lg"
                icon={isPaused(session) ? 'play' : 'pause'}
                className="sx-btn-back"
                onClick={isPaused(session) ? sessionActions.resume : sessionActions.pause}
              >
                {t(isPaused(session) ? 'session.timer.resume' : 'session.timer.pause')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                icon="back"
                className="sx-btn-back"
                disabled={!canGoBack(session)}
                onClick={sessionActions.back}
              >
                {t('session.back')}
              </Button>
            )}
            <Button
              variant={phase === 'countdownDone' ? 'success' : 'primary'}
              size="lg"
              icon="check"
              className={cx('sx-btn-main', phase === 'countdownDone' && 'breathe')}
              onClick={onDone}
            >
              {t('session.done')}
            </Button>
          </div>
        )}
      </div>

      {pulse && <div className={cx('pulse-overlay', `pulse-${pulse}`)} aria-hidden="true" />}
      {burst > 0 && <CheckBurst key={burst} />}
      <div className="visually-hidden" aria-live="polite">
        {burst > 0 ? t('session.doneAnnounce') : phase === 'restDone' ? t('session.rest.ended') : ''}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('session.menu')}>
        <div className="sx-menu">
          <MenuItem
            icon="skip"
            label={t('session.skipSet')}
            hint={t('session.skipSetHint')}
            disabled={resting}
            onClick={() => {
              setMenuOpen(false);
              sessionActions.complete('skipped');
            }}
          />
          <MenuItem
            icon="list"
            label={t('session.stepList')}
            hint={t('session.stepListHint')}
            onClick={() => {
              setMenuOpen(false);
              setListOpen(true);
            }}
          />
          <MenuItem
            icon="flag"
            label={t('session.endWorkout')}
            hint={t('session.endWorkoutHint')}
            danger
            onClick={() => {
              setMenuOpen(false);
              setEndOpen(true);
            }}
          />
        </div>
      </BottomSheet>

      <StepListSheet
        open={listOpen}
        session={session}
        onClose={() => setListOpen(false)}
        onPick={(index) => {
          setListOpen(false);
          sessionActions.jumpTo(index);
        }}
      />

      <ConfirmDialog
        open={endOpen || exitRequested}
        title={t('session.endConfirm.title')}
        message={t('session.endConfirm.message')}
        confirmLabel={t('session.endConfirm.confirm')}
        cancelLabel={t('session.endConfirm.cancel')}
        tone="danger"
        onConfirm={() => {
          setEndOpen(false);
          sessionActions.endEarly();
        }}
        onCancel={closeEnd}
      />
    </div>
  );
}

function isTimeStep(session: EngineSession, step: ReturnType<typeof currentStep>): boolean {
  if (!step || step.kind !== 'work') return false;
  const item = session.workout.items[(step as WorkStep).itemIndex];
  return item?.target.type === 'time';
}

function MenuItem({
  icon,
  label,
  hint,
  danger,
  disabled,
  onClick,
}: {
  icon: 'skip' | 'list' | 'flag';
  label: string;
  hint: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cx('sx-menu__item press', danger && 'sx-menu__item--danger')}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="sx-menu__icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="sx-menu__text">
        <span className="sx-menu__label">{label}</span>
        <span className="sx-menu__hint">{hint}</span>
      </span>
      <Icon name="forward" size={18} className="sx-menu__chev" />
    </button>
  );
}

/** Check-mark burst on "Done" (lime ring + drawn check). */
function CheckBurst() {
  return (
    <div className="sx-burst" aria-hidden="true">
      <span className="sx-burst__ring check-burst-ring" />
      <span className="sx-burst__disc check-burst">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path
            className="check-draw"
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
