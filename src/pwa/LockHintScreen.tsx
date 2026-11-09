import { nav } from '../app/nav';
import { Button, Icon, ScreenHeader } from '../components';
import type { IconName } from '../components';
import { useT } from '../i18n';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import './pwa.css';

/** Phone with a running rest ring, sound waves and a crossed-out lock (decorative, CSS-animated). */
function PhoneIllustration({ label }: { label: string }) {
  return (
    <svg className="pwa-phone" viewBox="0 0 200 200" role="img" aria-label={label}>
      <defs>
        <linearGradient id="pwa-rest-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7FA3C9" />
          <stop offset="1" stopColor="#A6C1DE" />
        </linearGradient>
      </defs>
      <g className="pwa-phone__waves" fill="none" stroke="url(#pwa-rest-grad)" strokeWidth="5" strokeLinecap="round">
        <path className="pwa-phone__wave pwa-phone__wave--1" d="M146 76a32 32 0 0 1 0 48" />
        <path className="pwa-phone__wave pwa-phone__wave--2" d="M158 62a52 52 0 0 1 0 76" />
        <path className="pwa-phone__wave pwa-phone__wave--1" d="M54 76a32 32 0 0 0 0 48" />
        <path className="pwa-phone__wave pwa-phone__wave--2" d="M42 62a52 52 0 0 0 0 76" />
      </g>
      <rect x="66" y="22" width="68" height="140" rx="16" fill="#141A24" stroke="#3A465A" strokeWidth="4" />
      <rect x="88" y="30" width="24" height="5" rx="2.5" fill="#3A465A" />
      <circle cx="100" cy="92" r="22" fill="none" stroke="#263042" strokeWidth="7" />
      <circle
        className="pwa-phone__ring"
        cx="100"
        cy="92"
        r="22"
        fill="none"
        stroke="url(#pwa-rest-grad)"
        strokeWidth="7"
        strokeLinecap="round"
        pathLength="100"
        transform="rotate(-90 100 92)"
      />
      <rect x="84" y="128" width="32" height="8" rx="4" fill="#263042" />
      <g className="pwa-phone__lock" transform="translate(126 128)">
        <circle r="24" fill="#F43F5E" />
        <path d="M-9 -1h18v14h-18zM-5.5 -1v-5a5.5 5.5 0 0 1 11 0v5" fill="none" stroke="#0B0F17" strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M-15 -15 15 15" stroke="#0B0F17" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * FR37 / D22: shown once before the first workout (nav routes here while !ui.lockHintSeen).
 * "Got it" marks the hint as seen and replaces this screen with the session.
 */
export function LockHintScreen({ workoutId: _workoutId }: { workoutId: string }) {
  const t = useT();
  const keepScreenOn = useSettings((s) => s.keepScreenOn);

  const tips: Array<{ icon: IconName; text: string }> = [
    { icon: 'sound', text: t('pwa.lock.tip.sound') },
    { icon: 'timer', text: t(keepScreenOn ? 'pwa.lock.tip.screenOn' : 'pwa.lock.tip.screenOff') },
    { icon: 'info', text: t('pwa.lock.tip.once') },
  ];

  const confirm = () => {
    useUi.getState().markLockHintSeen();
    nav.replace({ name: 'session' });
  };

  return (
    <div className="screen pwa-lock">
      <ScreenHeader eyebrow={t('pwa.lock.eyebrow')} title={t('pwa.lock.title')} onBack={nav.back} />
      <div className="screen-body stagger">
        <div className="pwa-lock__art">
          <PhoneIllustration label={t('pwa.lock.illustration')} />
        </div>
        <p className="pwa-lock__text">{t('pwa.lockHint.text')}</p>
        <ul className="pwa-tips stagger">
          {tips.map((tip) => (
            <li key={tip.icon} className="pwa-tip">
              <span className="pwa-tip__icon" aria-hidden="true">
                <Icon name={tip.icon} size={20} />
              </span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="action-bar">
        <Button size="lg" block icon="play" onClick={confirm}>
          {t('pwa.lock.confirm')}
        </Button>
      </div>
    </div>
  );
}
