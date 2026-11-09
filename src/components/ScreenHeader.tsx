import type { ReactNode } from 'react';
import { IconButton } from './Button';
import { cx } from './cx';
import { useT } from '../i18n';
import './components.css';

export interface ScreenHeaderProps {
  title: ReactNode;
  /** small caps line above the title */
  eyebrow?: ReactNode;
  /** shows a back button when given */
  onBack?: () => void;
  /** right-side actions (IconButtons) */
  actions?: ReactNode;
  /** large hero title (start screen) vs compact */
  large?: boolean;
  className?: string;
}

export function ScreenHeader({ title, eyebrow, onBack, actions, large, className }: ScreenHeaderProps) {
  const t = useT();
  return (
    <header className={cx('screen-header', large && 'screen-header--large', className)}>
      <div className="screen-header__bar">
        {onBack ? <IconButton icon="back" label={t('common.action.back')} onClick={onBack} /> : <span />}
        <div className="screen-header__actions">{actions}</div>
      </div>
      <div className="screen-header__titles">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="screen-header__title">{title}</h1>
      </div>
    </header>
  );
}
