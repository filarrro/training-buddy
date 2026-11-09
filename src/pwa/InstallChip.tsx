import { useEffect } from 'react';
import { Icon, cx } from '../components';
import { useT } from '../i18n';
import { isStandalone } from './platform';
import { dismissInstallChip, promptInstall, usePwa } from './store';
import './pwa.css';

const DOWNLOAD = 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14';

/**
 * FR38: subtle Android/Chromium install chip, visible only while the browser offers an install prompt.
 * Render it inline (e.g. on the start screen); without an inline instance, the PWA host shows a floating one.
 */
export function InstallChip({ floating = false }: { floating?: boolean }) {
  const t = useT();
  const prompt = usePwa((s) => s.installPrompt);
  const dismissed = usePwa((s) => s.installChipDismissed);

  useEffect(() => {
    if (floating) return;
    usePwa.setState((s) => ({ inlineChips: s.inlineChips + 1 }));
    return () => usePwa.setState((s) => ({ inlineChips: s.inlineChips - 1 }));
  }, [floating]);

  if (!prompt || dismissed || isStandalone()) return null;

  return (
    <div className={cx('pwa-chip', floating && 'pwa-chip--floating')}>
      <button type="button" className="pwa-chip__main press" onClick={() => void promptInstall()}>
        <span className="pwa-chip__icon">
          <Icon path={DOWNLOAD} size={18} strokeWidth={2.4} />
        </span>
        <span>{t('pwa.chip.install')}</span>
      </button>
      <button type="button" className="pwa-chip__close press" aria-label={t('pwa.chip.dismiss')} onClick={dismissInstallChip}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
