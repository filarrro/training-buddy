import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';
import { IconButton } from './Button';
import { useModal, usePresence } from './useModal';
import { useT } from '../i18n';
import './components.css';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** optional sticky footer (actions) */
  footer?: ReactNode;
  className?: string;
}

/** Modal sheet sliding up from the bottom (step list, menus, pickers). */
export function BottomSheet({ open, onClose, title, children, footer, className }: BottomSheetProps) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { mounted, closing } = usePresence(open, 260);
  useModal(open, onClose, ref);
  if (!mounted) return null;
  return createPortal(
    <div className={cx('modal-root', 'modal-root--sheet', closing && 'is-closing')}>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={cx('sheet', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sheet__grip" aria-hidden="true" />
        <div className="sheet__header">
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          <IconButton icon="close" label={t('common.action.close')} onClick={onClose} />
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
