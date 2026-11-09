import type { CSSProperties, KeyboardEvent } from 'react';
import { useRef } from 'react';
import { cx } from '../../components';
import './home.css';

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedProps<V extends string> {
  value: V;
  options: readonly SegmentedOption<V>[];
  onChange: (value: V) => void;
  /** accessible group label */
  label: string;
  /** colour of the sliding thumb: work (ember) or rest (teal) */
  tone?: 'work' | 'rest';
  className?: string;
}

/** Radio-group style segmented control with a sliding thumb (spring transition). */
export function Segmented<V extends string>({
  value,
  options,
  onChange,
  label,
  tone = 'work',
  className,
}: SegmentedProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const style = { '--seg-count': options.length, '--seg-index': index } as CSSProperties;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('seg', `seg--${tone}`, className)}
      style={style}
      onKeyDown={onKeyDown}
    >
      <span className="seg__thumb" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className={cx('seg__opt', o.value === value && 'is-active')}
          onClick={() => o.value !== value && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
