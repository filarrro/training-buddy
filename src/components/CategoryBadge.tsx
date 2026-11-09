import type { CSSProperties } from 'react';
import { CATEGORIES } from '../domain/builtins';
import type { Category } from '../domain/types';
import { useT } from '../i18n';
import { cx } from './cx';
import { Icon } from './Icon';
import './components.css';

export interface CategoryBadgeProps {
  category: Category;
  /** 'dot' = icon only (label still announced), 'sm' | 'md' = pill with label */
  size?: 'dot' | 'sm' | 'md';
  className?: string;
}

/** Colour + glyph + label — information never conveyed by colour alone. */
export function CategoryBadge({ category, size = 'sm', className }: CategoryBadgeProps) {
  const t = useT();
  const meta = CATEGORIES[category];
  const label = t(meta.labelKey);
  const style = { '--cat': `var(${meta.cssVar})` } as CSSProperties;
  if (size === 'dot') {
    return (
      <span className={cx('cat-dot', className)} style={style} role="img" aria-label={label} title={label}>
        <Icon path={meta.iconPath} size={16} strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span className={cx('cat-badge', `cat-badge--${size}`, className)} style={style}>
      <Icon path={meta.iconPath} size={size === 'md' ? 18 : 14} strokeWidth={2.2} />
      <span>{label}</span>
    </span>
  );
}
