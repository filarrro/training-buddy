import { cx } from './cx';
import { Icon } from './Icon';
import { useT } from '../i18n';
import './components.css';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** visible label */
  label: string;
  /** value formatter, e.g. formatClock / v => `${v} s` */
  format?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

/** − value + control. Values are clamped to [min, max] and snapped to `step` from min. */
export function Stepper({ value, onChange, min, max, step = 1, label, format, disabled, className }: StepperProps) {
  const t = useT();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const change = (dir: 1 | -1) => {
    const next = clamp(value + dir * step);
    if (next !== value) onChange(next);
  };
  const text = format ? format(value) : String(value);
  return (
    <div className={cx('stepper', className)} role="group" aria-label={label}>
      <span className="stepper__label">{label}</span>
      <div className="stepper__controls">
        <button
          type="button"
          className="stepper__btn press"
          onClick={() => change(-1)}
          disabled={disabled || value <= min}
          aria-label={`${t('common.action.decrease')}: ${label}`}
        >
          <Icon name="minus" />
        </button>
        <output className="stepper__value tabular" aria-live="polite">
          {text}
        </output>
        <button
          type="button"
          className="stepper__btn press"
          onClick={() => change(1)}
          disabled={disabled || value >= max}
          aria-label={`${t('common.action.increase')}: ${label}`}
        >
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
