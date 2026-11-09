import { useId } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../../components';
import type { IconName } from '../../components';
import './home.css';

export interface ToggleRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  icon?: IconName;
}

/** Settings row with a switch (role="switch"); the whole row is the tap target. */
export function ToggleRow({ checked, onChange, label, description, icon }: ToggleRowProps) {
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? descId : undefined}
      className="set-row set-row--toggle press"
      onClick={() => onChange(!checked)}
    >
      {icon && (
        <span className="set-row__icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="set-row__text">
        <span className="set-row__label">{label}</span>
        {description && (
          <span id={descId} className="set-row__desc">
            {description}
          </span>
        )}
      </span>
      <span className={checked ? 'switch is-on' : 'switch'} aria-hidden="true">
        <span className="switch__knob" />
      </span>
    </button>
  );
}
