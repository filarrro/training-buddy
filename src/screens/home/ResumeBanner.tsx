import { useState } from 'react';
import { nav } from '../../app/nav';
import { Button, ConfirmDialog, Icon } from '../../components';
import { workoutName } from '../../domain/format';
import { useT } from '../../i18n';
import { progress } from '../../session/engine';
import { STALE_AFTER_MS } from '../../session/persist';
import { discardSaved, resumeSaved, useSessionStore } from '../../session/store';
import './home.css';

/** Start screen: an unfinished workout from a previous run — continue it or discard it (FR4). */
export function ResumeBanner() {
  const t = useT();
  const saved = useSessionStore((s) => s.saved);
  const [confirm, setConfirm] = useState(false);
  if (!saved) return null;

  const name = workoutName(saved.session.workout, t);
  const prog = progress(saved.session);
  const stale = Date.now() - saved.savedAt > STALE_AFTER_MS;
  const resume = () => {
    if (resumeSaved()) nav.go({ name: 'session' });
  };

  return (
    <section className="resume fade-up" aria-labelledby="resume-title">
      <div className="resume__head">
        <span className="resume__icon" aria-hidden="true">
          <Icon name="timer" size={22} />
        </span>
        <div className="resume__text">
          <span id="resume-title" className="eyebrow resume__eyebrow">
            {t('start.resume.eyebrow')}
          </span>
          <span className="resume__name">{name}</span>
          <span className="resume__meta tabular">
            {t('start.resume.progress', { done: prog.done + prog.skipped, total: prog.total })}
          </span>
        </div>
      </div>
      {stale && <p className="resume__stale">{t('start.resume.stale')}</p>}
      <div className="row resume__actions">
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          {t('start.resume.discard')}
        </Button>
        <Button variant="primary" icon="play" className="resume__go" onClick={resume}>
          {t('start.resume.continue')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        tone="danger"
        title={t('start.resume.discardTitle')}
        message={t('start.resume.discardMessage', { name })}
        confirmLabel={t('start.resume.discard')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          discardSaved();
        }}
      />
    </section>
  );
}
