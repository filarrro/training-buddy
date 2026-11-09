import type { CSSProperties } from 'react';
import { cx } from './cx';
import './components.css';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  tone?: 'work' | 'rest' | 'success';
  /** accessible label, e.g. "Postęp treningu" */
  label: string;
  /** visible value text for screen readers, e.g. "7 / 20" */
  valueText?: string;
  className?: string;
}

/** Spring-filled progress bar (transform-based, GPU friendly). */
export function ProgressBar({ value, tone = 'work', label, valueText, className }: ProgressBarProps) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cx('progress', `progress--${tone}`, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-valuetext={valueText}
    >
      <div className="progress__fill" style={{ '--p': v } as CSSProperties} />
    </div>
  );
}
