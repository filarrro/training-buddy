import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import './components.css';

export type ButtonVariant = 'primary' | 'rest' | 'success' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** lg = 60px thumb-zone primary action */
  size?: ButtonSize;
  /** full width */
  block?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', 'press', className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 24 : 20} />}
      {children !== undefined && <span className="btn__label">{children}</span>}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 24 : 20} />}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** required accessible label */
  label: string;
  variant?: 'ghost' | 'secondary';
}

/** Square 48px icon-only button. */
export function IconButton({ icon, label, variant = 'ghost', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx('icon-btn', `icon-btn--${variant}`, 'press', className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
