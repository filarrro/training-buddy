import { useT } from '../i18n';
import './app.css';

/** Animated splash shown until persisted stores hydrate (FR40). */
export function Splash() {
  const t = useT();
  return (
    <div className="splash" role="status" aria-label={t('common.loading')}>
      <div className="splash__inner">
        <div className="splash__logo">
          <span className="splash__ring" aria-hidden="true" />
          <span className="splash__mark">TB</span>
        </div>
        <div className="splash__name">{t('common.app.name')}</div>
      </div>
    </div>
  );
}
