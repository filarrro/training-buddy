import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import './components.css';

export interface ProgressRingProps {
  /** 0..1 — fraction of the ring that is filled */
  progress: number;
  size?: number;
  stroke?: number;
  tone?: 'work' | 'rest' | 'success';
  /** smooth transition between values (disable when driving per-frame) */
  animated?: boolean;
  className?: string;
  /** centre content (e.g. big timer) */
  children?: ReactNode;
  label?: string;
}

/** SVG countdown ring with gradient stroke. */
export function ProgressRing({
  progress,
  size = 280,
  stroke = 14,
  tone = 'rest',
  animated = true,
  className,
  children,
  label,
}: ProgressRingProps) {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gradId = `ring-grad-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <div
      className={cx('ring', `ring--${tone}`, className)}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="ring__stop1" />
            <stop offset="100%" className="ring__stop2" />
          </linearGradient>
        </defs>
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className={cx('ring__value', animated && 'ring__value--animated')}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children !== undefined && <div className="ring__center">{children}</div>}
    </div>
  );
}
