import { useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import type { ButtonVariant } from './Button';
import { cx } from './cx';
import { useModal, usePresence } from './useModal';
import { useT } from '../i18n';
import './components.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  /** defaults to common.action.confirm */
  confirmLabel?: string;
  /** defaults to common.action.cancel */
  cancelLabel?: string;
  /** 'danger' for destructive actions */
  tone?: Extract<ButtonVariant, 'primary' | 'danger' | 'rest' | 'success'>;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible modal confirm (role=alertdialog). Cancel gets initial focus. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const { mounted, closing } = usePresence(open);
  useModal(open, onCancel, ref);
  if (!mounted) return null;
  return createPortal(
    <div className={cx('modal-root', closing && 'is-closing')}>
      <div className="scrim" onClick={onCancel} aria-hidden="true" />
      <div
        ref={ref}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        tabIndex={-1}
      >
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        {message && (
          <div id={descId} className="dialog__message">
            {message}
          </div>
        )}
        <div className="dialog__actions">
          <Button variant="secondary" size="md" onClick={onCancel} data-autofocus>
            {cancelLabel ?? t('common.action.cancel')}
          </Button>
          <Button variant={tone} size="md" onClick={onConfirm}>
            {confirmLabel ?? t('common.action.confirm')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
