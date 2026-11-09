import type { ReactNode } from 'react';
import { ScreenHeader } from '../components';
import { useT } from '../i18n';
import { nav } from './nav';

/** Temporary screen body used by foundation placeholders. Feature agents replace their screens. */
export function Placeholder({ title, children, back = true }: { title: string; children?: ReactNode; back?: boolean }) {
  const t = useT();
  return (
    <div className="screen">
      <ScreenHeader title={title} eyebrow={t('common.todo')} onBack={back ? nav.back : undefined} />
      <div className="screen-body stagger">{children}</div>
    </div>
  );
}
