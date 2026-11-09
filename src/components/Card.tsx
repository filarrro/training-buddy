import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import './components.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** render as a <button> with press feedback */
  interactive?: boolean;
  /** CSS colour for the left accent stripe, e.g. 'var(--c-cat-pull)' */
  accent?: string;
  /** elevated (lighter) surface */
  elevated?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function Card({ interactive, accent, elevated, disabled, className, style, children, ...rest }: CardProps) {
  const cls = cx('card', elevated && 'card--elevated', interactive && 'card--interactive press', accent && 'card--accent', className);
  const st = accent ? ({ ...style, '--card-accent': accent } as CSSProperties) : style;
  if (interactive) {
    return (
      <button type="button" className={cls} style={st} disabled={disabled} {...(rest as HTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={st} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
}
