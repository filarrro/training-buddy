import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CATEGORIES } from '../../domain/builtins';
import { CATEGORY_IDS } from '../../domain/types';
import type { Category, TargetType } from '../../domain/types';
import type { TargetError } from '../../domain/validation';
import { Icon, cx } from '../../components';
import { useT } from '../../i18n';
import { patchTargetDraft } from './forms';
import type { TargetDraft } from './forms';

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="cfg-error fade-in" role="alert">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength: number;
  error?: string | null;
  hint?: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TextField({ label, value, onChange, placeholder, maxLength, error, hint, disabled, autoFocus }: TextFieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const len = value.trim().length;
  return (
    <div className={cx('cfg-field', error && 'is-invalid')}>
      <div className="row-between">
        <label htmlFor={id} className="cfg-label">
          {label}
        </label>
        {!disabled && (
          <span className={cx('cfg-counter tabular', len > maxLength && 'text-danger')} aria-hidden="true">
            {len}/{maxLength}
          </span>
        )}
      </div>
      <input
        id={id}
        type="text"
        className="cfg-input cfg-input--lg"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength + 10}
        autoComplete="off"
        autoCapitalize="sentences"
        enterKeyHint="done"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      {hint && !error && <p className="cfg-hint">{hint}</p>}
      <FieldError id={errId}>{error}</FieldError>
    </div>
  );
}

export interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (raw: string) => void;
  unit?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/** Compact numeric input with the numeric keypad (inputMode) and a unit suffix. */
export function NumberField({ label, value, onChange, unit, invalid, disabled }: NumberFieldProps) {
  const id = useId();
  return (
    <div className={cx('cfg-num', invalid && 'is-invalid')}>
      <label htmlFor={id} className="cfg-num__label">
        {label}
      </label>
      <div className="cfg-num__box">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="cfg-input cfg-num__input tabular"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          aria-invalid={invalid ? true : undefined}
          disabled={disabled}
          enterKeyHint="done"
        />
        {unit && (
          <span className="cfg-num__unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

/** Radio group styled as a segmented control with a sliding thumb. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  tone = 'work',
}: {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
  tone?: 'work' | 'neutral';
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const style = { '--seg-n': options.length, '--seg-i': idx } as CSSProperties;
  return (
    <div className={cx('cfg-seg', `cfg-seg--${tone}`)} role="radiogroup" aria-label={label} style={style}>
      <span className="cfg-seg__thumb" aria-hidden="true" />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cx('cfg-seg__opt', o.value === value && 'is-active')}
          onClick={() => onChange(o.value)}
          disabled={disabled}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Switch({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="cfg-switch-row">
      <div className="grow">
        <label htmlFor={id} className="cfg-label">
          {label}
        </label>
        {hint && <p className="cfg-hint">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={cx('cfg-switch press', checked && 'is-on')}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="cfg-switch__knob" />
      </button>
    </div>
  );
}

/** Category chooser: five coloured chips (colour + glyph + label, FR1). */
export function CategoryPicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Category;
  onChange: (c: Category) => void;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <fieldset className="cfg-field" disabled={disabled}>
      <legend className="cfg-label">{label}</legend>
      <div className="cfg-cats" role="radiogroup" aria-label={label}>
        {CATEGORY_IDS.map((c) => {
          const meta = CATEGORIES[c];
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === value}
              className={cx('cfg-cat press', c === value && 'is-active')}
              style={{ '--cat': `var(${meta.cssVar})` } as CSSProperties}
              onClick={() => onChange(c)}
            >
              <Icon path={meta.iconPath} size={18} strokeWidth={2.2} />
              <span>{t(meta.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Inline editor of a full target (reps range or time range + target), FR22 / D41. */
export function TargetFields({
  draft,
  onChange,
  errors,
  disabled,
  showHint = true,
}: {
  draft: TargetDraft;
  onChange: (d: TargetDraft) => void;
  errors: readonly TargetError[];
  disabled?: boolean;
  showHint?: boolean;
}) {
  const t = useT();
  const has = (...codes: TargetError[]) => codes.some((c) => errors.includes(c));
  const set = (field: keyof Omit<TargetDraft, 'type'>) => (raw: string) => onChange(patchTargetDraft(draft, field, raw));
  return (
    <div className="cfg-target">
      {draft.type === 'reps' ? (
        <div className="cfg-target__grid cfg-target__grid--2 fade-in" key="reps">
          <NumberField
            label={t('config.form.repsMin')}
            value={draft.min}
            onChange={set('min')}
            unit={t('config.form.unitReps')}
            invalid={has('repsMin', 'repsOrder')}
            disabled={disabled}
          />
          <NumberField
            label={t('config.form.repsMax')}
            value={draft.max}
            onChange={set('max')}
            unit={t('config.form.unitReps')}
            invalid={has('repsMax', 'repsOrder')}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="cfg-target__grid cfg-target__grid--3 fade-in" key="time">
          <NumberField
            label={t('config.form.timeMin')}
            value={draft.minSec}
            onChange={set('minSec')}
            unit={t('config.form.unitSec')}
            invalid={has('timeMin', 'timeOrder')}
            disabled={disabled}
          />
          <NumberField
            label={t('config.form.timeMax')}
            value={draft.maxSec}
            onChange={set('maxSec')}
            unit={t('config.form.unitSec')}
            invalid={has('timeMax', 'timeOrder')}
            disabled={disabled}
          />
          <NumberField
            label={t('config.form.timeTarget')}
            value={draft.targetSec}
            onChange={set('targetSec')}
            unit={t('config.form.unitSec')}
            invalid={has('timeTarget')}
            disabled={disabled}
          />
        </div>
      )}
      {errors.length > 0 ? (
        <div className="cfg-target__errors">
          {errors.map((e) => (
            <FieldError key={e}>{t(`config.error.${e}`)}</FieldError>
          ))}
        </div>
      ) : (
        showHint && <p className="cfg-hint">{t(`config.form.targetHint.${draft.type}`)}</p>
      )}
    </div>
  );
}

export function TypeIcon({ type }: { type: TargetType }) {
  return <Icon name={type === 'reps' ? 'repeat' : 'timer'} size={18} />;
}
