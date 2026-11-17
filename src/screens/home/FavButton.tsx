import { Icon, cx } from '../../components';
import { useT } from '../../i18n';
import { useIsFavorite, useLibrary } from '../../stores/library';
import './home.css';

export interface FavButtonProps {
  /** plan or workout id */
  id: string;
  /** name of the plan / workout, for the accessible label */
  name: string;
  /** 'card' = small star laid over the bottom-right corner of a card; 'header' = icon button */
  variant?: 'card' | 'header';
}

/** Star toggle: favourites are listed first on the start screen. */
export function FavButton({ id, name, variant = 'card' }: FavButtonProps) {
  const t = useT();
  const on = useIsFavorite(id);
  const label = t(on ? 'start.fav.removeNamed' : 'start.fav.addNamed', { name });
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={t(on ? 'start.fav.remove' : 'start.fav.add')}
      className={cx(variant === 'header' ? 'icon-btn icon-btn--ghost' : 'fav-btn', 'fav', on && 'is-on', 'press')}
      onClick={() => useLibrary.getState().toggleFavorite(id)}
    >
      <Icon name="star" size={variant === 'header' ? 24 : 20} />
    </button>
  );
}
