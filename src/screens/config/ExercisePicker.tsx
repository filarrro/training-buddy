import { useState } from 'react';
import type { CSSProperties } from 'react';
import { BottomSheet, CategoryBadge, Icon, cx } from '../../components';
import { CATEGORIES } from '../../domain/builtins';
import { exerciseName, formatSetsTarget } from '../../domain/format';
import { CATEGORY_IDS } from '../../domain/types';
import type { Category, Exercise } from '../../domain/types';
import { useT } from '../../i18n';
import { useAllExercises } from '../../stores/library';

/** Bottom-sheet exercise picker with a category filter (FR25). Built-in + custom exercises. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (ex: Exercise) => void;
}) {
  const t = useT();
  const all = useAllExercises();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const list = filter === 'all' ? all : all.filter((e) => e.category === filter);

  return (
    <BottomSheet open={open} onClose={onClose} title={t('config.picker.title')} className="cfg-picker">
      <div className="cfg-chips" role="radiogroup" aria-label={t('config.exercise.category')}>
        <button
          type="button"
          role="radio"
          aria-checked={filter === 'all'}
          className={cx('cfg-chip press', filter === 'all' && 'is-active')}
          onClick={() => setFilter('all')}
        >
          {t('config.picker.all')}
        </button>
        {CATEGORY_IDS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={filter === c}
            className={cx('cfg-chip press', filter === c && 'is-active')}
            style={{ '--cat': `var(${CATEGORIES[c].cssVar})` } as CSSProperties}
            onClick={() => setFilter(c)}
          >
            <Icon path={CATEGORIES[c].iconPath} size={14} strokeWidth={2.4} />
            {t(CATEGORIES[c].labelKey)}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="cfg-empty">{t('config.picker.empty')}</p>
      ) : (
        <ul className="cfg-picker__list stagger" key={filter}>
          {list.map((ex) => (
            <li key={ex.id}>
              <button type="button" className="cfg-pick press" onClick={() => onPick(ex)}>
                <CategoryBadge category={ex.category} size="dot" />
                <span className="grow">
                  <span className="cfg-pick__name">{exerciseName(ex, t)}</span>
                  <span className="cfg-pick__meta tabular">
                    {formatSetsTarget(ex.defaultSets, ex.defaultTarget, t, {
                      unilateral: ex.unilateral,
                      category: ex.category,
                    })}
                    {!ex.builtIn && ` · ${t('config.workouts.custom')}`}
                  </span>
                </span>
                <span className="cfg-pick__add" aria-hidden="true">
                  <Icon name="plus" size={20} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
