import { Stepper } from '../../components';
import { formatClock } from '../../domain/format';
import type { RestSettings, WorkoutMode } from '../../domain/types';
import { LIMITS } from '../../domain/validation';
import { useT } from '../../i18n';

/** FR8: classic ±15 s, circuit ±5 s. */
export const REST_STEP: Record<WorkoutMode, number> = { straight: 15, circuit: 5 };

export interface RestPanelProps {
  mode: WorkoutMode;
  rest: RestSettings;
  /** show the side-switch stepper (workout has a unilateral exercise) */
  showSides: boolean;
  /** straight mode: every block has its own rest → the workout-wide steppers would do nothing */
  perExerciseRests?: boolean;
  onChange: (rest: RestSettings) => void;
}

/** Rest steppers for the selected mode (FR8, FR9, D17). Each mode keeps its own values. */
export function RestPanel({ mode, rest, showSides, perExerciseRests, onChange }: RestPanelProps) {
  const t = useT();
  const step = REST_STEP[mode];
  const min = LIMITS.restMinSec;
  const max = LIMITS.restMaxSec;
  const fmt = (v: number) => (v === 0 ? t('preview.rest.none') : formatClock(v));
  const fmtSides = (v: number) => (v === 0 ? t('preview.rest.noTimer') : formatClock(v));

  return (
    <div className="rest-panel stagger" key={mode}>
      {mode === 'straight' && perExerciseRests ? (
        <p className="muted small">{t('preview.rest.perExercise')}</p>
      ) : mode === 'straight' ? (
        <>
          <Stepper
            label={t('preview.rest.betweenSets')}
            value={rest.straight.betweenSetsSec}
            min={min}
            max={max}
            step={step}
            format={fmt}
            onChange={(v) => onChange({ ...rest, straight: { ...rest.straight, betweenSetsSec: v } })}
          />
          <Stepper
            label={t('preview.rest.betweenExercises')}
            value={rest.straight.betweenExercisesSec}
            min={min}
            max={max}
            step={step}
            format={fmt}
            onChange={(v) => onChange({ ...rest, straight: { ...rest.straight, betweenExercisesSec: v } })}
          />
        </>
      ) : (
        <>
          <Stepper
            label={t('preview.rest.betweenExercisesRound')}
            value={rest.circuit.betweenExercisesSec}
            min={min}
            max={max}
            step={step}
            format={fmt}
            onChange={(v) => onChange({ ...rest, circuit: { ...rest.circuit, betweenExercisesSec: v } })}
          />
          <Stepper
            label={t('preview.rest.betweenRounds')}
            value={rest.circuit.betweenRoundsSec}
            min={min}
            max={max}
            step={step}
            format={fmt}
            onChange={(v) => onChange({ ...rest, circuit: { ...rest.circuit, betweenRoundsSec: v } })}
          />
        </>
      )}
      {showSides && (
        <Stepper
          label={t('preview.rest.betweenSides')}
          value={rest.betweenSidesSec}
          min={min}
          max={max}
          step={step}
          format={fmtSides}
          onChange={(v) => onChange({ ...rest, betweenSidesSec: v })}
        />
      )}
    </div>
  );
}
