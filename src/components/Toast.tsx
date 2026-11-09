import { cx } from './cx';
import { Icon } from './Icon';
import { useToast } from '../stores/toast';
import type { ToastItem } from '../stores/toast';
import { useT } from '../i18n';
import './components.css';

export interface ToastProps {
  toast: Pick<ToastItem, 'message' | 'tone' | 'actionLabel' | 'onAction'>;
  onClose?: () => void;
}

/** Single toast pill (presentational). */
export function Toast({ toast, onClose }: ToastProps) {
  const t = useT();
  return (
    <div className={cx('toast', `toast--${toast.tone}`)} role="status">
      {toast.tone === 'success' && <Icon name="check" size={20} />}
      <span className="toast__msg">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button type="button" className="toast__action press" onClick={toast.onAction}>
          {toast.actionLabel}
        </button>
      )}
      {onClose && (
        <button type="button" className="toast__close press" onClick={onClose} aria-label={t('common.action.close')}>
          <Icon name="close" size={18} />
        </button>
      )}
    </div>
  );
}

/** Renders queued toasts from the toast store (mounted once in App). Use showToast() to add. */
export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((item) => (
        <Toast key={item.id} toast={item} onClose={() => dismiss(item.id)} />
      ))}
    </div>
  );
}
