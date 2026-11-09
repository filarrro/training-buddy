import { useEffect, useState } from 'react';
import { useScreen } from '../app/nav';
import type { ScreenName } from '../app/nav';
import { Button, Icon, IconButton } from '../components';
import { useT } from '../i18n';
import { InstallChip } from './InstallChip';
import { dismissUpdate, usePwa } from './store';
import './pwa.css';

/**
 * Screens where an update must never be applied (FR35, D44: no reload during a session). The update
 * is still announced there (EC19, T8 AC), but without the "Refresh" action.
 */
const QUIET_SCREENS: ReadonlySet<ScreenName> = new Set<ScreenName>(['session', 'lockHint']);

/** The in-session notice hides itself after this time (it sits over the session header). */
export const SESSION_NOTICE_MS = 8000;

/**
 * PWA overlay host, mounted once in App:
 * - "New version available — Refresh" banner (FR35). Never reloads by itself. During a session it
 *   shows a short notice without "Refresh" (EC19); the actionable banner returns after the session.
 *   An ignored update applies on the next cold start (the waiting SW activates once all windows close).
 * - floating Android install chip on the start screen when no inline <InstallChip/> is rendered (FR38).
 */
export function UpdateToast() {
  const t = useT();
  const screen = useScreen().name;
  const needRefresh = usePwa((s) => s.needRefresh);
  const dismissed = usePwa((s) => s.updateDismissed);
  const applyUpdate = usePwa((s) => s.applyUpdate);
  const inlineChips = usePwa((s) => s.inlineChips);
  const quiet = QUIET_SCREENS.has(screen);
  const [noticeExpired, setNoticeExpired] = useState(false);

  const showUpdate = needRefresh && !dismissed && !(quiet && noticeExpired);

  // The in-session notice is informational only: hide it after a while (it never reappears in this
  // session screen, but the actionable banner shows again once the user leaves the session).
  useEffect(() => {
    if (!quiet || !needRefresh || dismissed) return;
    const id = window.setTimeout(() => setNoticeExpired(true), SESSION_NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [quiet, needRefresh, dismissed]);
  useEffect(() => {
    if (!quiet) setNoticeExpired(false);
  }, [quiet]);

  return (
    <>
      {showUpdate && (
        <div className={quiet ? 'pwa-update pwa-update--quiet' : 'pwa-update'} role="status" aria-live="polite">
          <span className="pwa-update__icon" aria-hidden="true">
            <Icon name="bolt" size={20} />
          </span>
          <div className="pwa-update__text">
            <strong>{t('pwa.update.title')}</strong>
            <span>{t(quiet ? 'pwa.update.sessionBody' : 'pwa.update.body')}</span>
          </div>
          <div className="pwa-update__actions">
            {!quiet && (
              <Button size="sm" onClick={() => applyUpdate?.()} disabled={!applyUpdate}>
                {t('pwa.update.refresh')}
              </Button>
            )}
            <IconButton icon="close" label={t('pwa.update.later')} onClick={dismissUpdate} />
          </div>
        </div>
      )}
      {screen === 'start' && inlineChips === 0 && <InstallChip floating />}
    </>
  );
}
