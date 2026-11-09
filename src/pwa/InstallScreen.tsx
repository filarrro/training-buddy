import type { CSSProperties, ReactNode } from 'react';
import { nav } from '../app/nav';
import { Button, Icon, ScreenHeader } from '../components';
import { useT } from '../i18n';
import { useUi } from '../stores/ui';
import './pwa.css';

const ADD_SQUARE = 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3ZM12 8.5v7M8.5 12h7';
const ICON_SRC = `${import.meta.env.BASE_URL}icons/icon.svg`;

interface StepProps {
  index: number;
  title: string;
  body: string;
  visual: ReactNode;
}

function Step({ index, title, body, visual }: StepProps) {
  return (
    <li className="pwa-step" style={{ '--i': index } as CSSProperties}>
      <span className="pwa-step__num tabular" aria-hidden="true">
        {index + 1}
      </span>
      <div className="pwa-step__text">
        <strong>{title}</strong>
        <span className="muted">{body}</span>
      </div>
      <span className="pwa-step__visual" aria-hidden="true">
        {visual}
      </span>
    </li>
  );
}

/**
 * FR36 / D31: first launch in Safari on iOS (not from the Home Screen). Explains how to install,
 * warns that browser data won't carry over, shows the FR37 lock hint and lets the user continue.
 */
export function InstallScreen() {
  const t = useT();

  const continueInBrowser = () => {
    const ui = useUi.getState();
    ui.markInstallScreenSeen();
    ui.markLockHintSeen(); // FR37 hint is on this screen — it does not come back before the first workout
    nav.reset();
  };

  return (
    <div className="screen pwa-install">
      <ScreenHeader large eyebrow={t('pwa.install.eyebrow')} title={t('pwa.install.title')} />
      <div className="screen-body stagger">
        <div className="pwa-install__hero">
          <img className="pwa-install__app-icon" src={ICON_SRC} alt="" width={72} height={72} />
          <p className="pwa-install__lead">{t('pwa.install.lead')}</p>
        </div>

        <div className="pwa-note pwa-note--warn" role="note">
          <span className="pwa-note__icon" aria-hidden="true">
            <Icon name="info" size={20} />
          </span>
          <div>
            <strong>{t('pwa.install.warning.title')}</strong>
            <p>{t('pwa.install.warning.body')}</p>
          </div>
        </div>

        <section aria-label={t('pwa.install.stepsLabel')}>
          <ol className="pwa-steps">
            <Step
              index={0}
              title={t('pwa.install.step1.title')}
              body={t('pwa.install.step1.body')}
              visual={<Icon name="share" size={22} />}
            />
            <Step
              index={1}
              title={t('pwa.install.step2.title')}
              body={t('pwa.install.step2.body')}
              visual={<Icon path={ADD_SQUARE} size={22} />}
            />
            <Step
              index={2}
              title={t('pwa.install.step3.title')}
              body={t('pwa.install.step3.body')}
              visual={<img src={ICON_SRC} alt="" width={26} height={26} className="pwa-step__app" />}
            />
          </ol>
        </section>

        <div className="pwa-note pwa-note--rest" role="note">
          <span className="pwa-note__icon" aria-hidden="true">
            <Icon name="lock" size={20} />
          </span>
          <div>
            <strong>{t('pwa.install.lock.title')}</strong>
            <p>{t('pwa.lockHint.text')}</p>
          </div>
        </div>
      </div>
      <div className="action-bar">
        <Button variant="secondary" size="lg" block onClick={continueInBrowser}>
          {t('pwa.install.continue')}
        </Button>
      </div>
    </div>
  );
}
