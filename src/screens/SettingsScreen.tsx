import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { version as APP_VERSION } from '../../package.json';
import { nav } from '../app/nav';
import { Button, ConfirmDialog, Icon, ScreenHeader } from '../components';
import { setThemeChoice, useResolvedTheme } from '../app/theme';
import { applyBackup, buildBackup, parseBackup, saveBackupFile } from '../data/backup';
import type { BackupFile } from '../data/backup';
import { canVibrate } from '../session/haptics';
import type { Lang, ThemeChoice } from '../domain/types';

const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];
import { LANGS, useT } from '../i18n';
import { showToast } from '../stores/toast';
import { useSettings } from '../stores/settings';
import { playTestBeep } from './home/beep';
import { resetAllData } from './home/resetData';
import { Segmented } from './home/Segmented';
import { ToggleRow } from './home/Toggle';
import './home/home.css';

/** Settings (FR28, FR29 partial, FR39): language, theme, sound + test, keep screen on, reset, version. */
export function SettingsScreen() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const sound = useSettings((s) => s.sound);
  const keepScreenOn = useSettings((s) => s.keepScreenOn);
  const countdownBeeps = useSettings((s) => s.countdownBeeps);
  const vibration = useSettings((s) => s.vibration);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);
  const themeChoice = useSettings((s) => s.theme);
  const resolved = useResolvedTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [beeping, setBeeping] = useState(false);

  const testSound = async () => {
    setBeeping(true);
    const ok = await playTestBeep();
    if (!ok) showToast(t('settings.sound.testUnavailable'), { tone: 'danger' });
    window.setTimeout(() => setBeeping(false), 600);
  };

  const exportData = async () => {
    try {
      if ((await saveBackupFile(buildBackup())) === 'saved') showToast(t('settings.export.done'), { tone: 'success' });
    } catch {
      showToast(t('settings.export.failed'), { tone: 'danger' });
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // the same file can be picked again
    if (!file) return;
    let text = '';
    try {
      text = await file.text();
    } catch {
      /* unreadable file → invalid */
    }
    const parsed = parseBackup(text);
    if (parsed.ok) setPendingImport(parsed.file);
    else showToast(t(`settings.import.${parsed.error}`), { tone: 'danger', durationMs: 6000 });
  };

  const doImport = () => {
    if (!pendingImport) return;
    applyBackup(pendingImport);
    setPendingImport(null);
    showToast(t('settings.import.done'), { tone: 'success' });
  };

  const importDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '–' : d.toLocaleDateString(lang);
  };

  const doReset = () => {
    setResetting(true);
    void resetAllData();
  };

  return (
    <div className="screen settings">
      <ScreenHeader title={t('settings.title')} onBack={nav.back} />

      <div className="screen-body stagger">
        <section className="set-group" aria-labelledby="set-general">
          <h2 id="set-general" className="section-title">
            {t('settings.section.general')}
          </h2>
          <div className="set-card">
            <div className="set-row">
              <span className="set-row__icon" aria-hidden="true">
                <Icon name="globe" size={20} />
              </span>
              <span className="set-row__text">
                <span className="set-row__label">
                  {t('settings.language')}
                </span>
              </span>
            </div>
            <Segmented<Lang>
              label={t('settings.language')}
              value={lang}
              options={LANGS.map((l) => ({ value: l, label: t(`settings.language.${l}`) }))}
              onChange={(l) => useSettings.getState().setLang(l)}
            />
          </div>
        </section>

        <section className="set-group" aria-labelledby="set-appearance">
          <h2 id="set-appearance" className="section-title">
            {t('settings.section.appearance')}
          </h2>
          <div className="set-card">
            <div className="set-row">
              <span className="set-row__icon" aria-hidden="true">
                <Icon name={resolved === 'light' ? 'sun' : 'moon'} size={20} />
              </span>
              <span className="set-row__text">
                <span className="set-row__label">{t('settings.theme')}</span>
                <span className="set-row__desc">
                  {themeChoice === 'system'
                    ? t('settings.theme.systemNow', { theme: t(`settings.theme.now.${resolved}`) })
                    : t('settings.theme.fixedDesc')}
                </span>
              </span>
            </div>
            <Segmented<ThemeChoice>
              label={t('settings.theme')}
              value={themeChoice}
              options={THEME_CHOICES.map((c) => ({ value: c, label: t(`settings.theme.${c}`) }))}
              onChange={setThemeChoice}
            />
          </div>
        </section>

        <section className="set-group" aria-labelledby="set-signals">
          <h2 id="set-signals" className="section-title">
            {t('settings.section.signals')}
          </h2>
          <div className="set-card">
            <ToggleRow
              icon={sound ? 'sound' : 'mute'}
              label={t('settings.sound')}
              description={t('settings.sound.desc')}
              checked={sound}
              onChange={(v) => useSettings.getState().update({ sound: v })}
            />
            <ToggleRow
              icon="timer"
              label={t('settings.countdownBeeps')}
              description={t('settings.countdownBeeps.desc')}
              checked={countdownBeeps}
              onChange={(v) => useSettings.getState().update({ countdownBeeps: v })}
            />
            {canVibrate() && (
              <ToggleRow
                icon="device"
                label={t('settings.vibration')}
                description={t('settings.vibration.desc')}
                checked={vibration}
                onChange={(v) => useSettings.getState().update({ vibration: v })}
              />
            )}
            <Button
              variant="secondary"
              block
              icon="sound"
              className={beeping ? 'is-beeping' : undefined}
              onClick={() => void testSound()}
            >
              {t('settings.sound.test')}
            </Button>
            <p className="set-info">
              <Icon name="info" size={18} />
              <span>{t('settings.sound.iosInfo')}</span>
            </p>
          </div>
        </section>

        <section className="set-group" aria-labelledby="set-workout">
          <h2 id="set-workout" className="section-title">
            {t('settings.section.workout')}
          </h2>
          <div className="set-card">
            <ToggleRow
              icon="lock"
              label={t('settings.keepScreenOn')}
              description={t('settings.keepScreenOn.desc')}
              checked={keepScreenOn}
              onChange={(v) => useSettings.getState().update({ keepScreenOn: v })}
            />
          </div>
        </section>

        <section className="set-group" aria-labelledby="set-data">
          <h2 id="set-data" className="section-title">
            {t('settings.section.data')}
          </h2>
          <div className="set-card">
            <p className="muted small">{t('settings.backup.desc')}</p>
            <Button variant="secondary" block icon="share" onClick={() => void exportData()}>
              {t('settings.export')}
            </Button>
            <Button variant="secondary" block icon="copy" onClick={() => fileInput.current?.click()}>
              {t('settings.import')}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              aria-label={t('settings.import')}
              tabIndex={-1}
              onChange={(e) => void onFile(e)}
            />
          </div>
          <div className="set-card">
            <p className="muted small">{t('settings.reset.desc')}</p>
            <Button variant="danger" block icon="trash" disabled={resetting} onClick={() => setConfirmReset(true)}>
              {t('settings.reset')}
            </Button>
          </div>
        </section>

        <section className="about" aria-label={t('settings.section.about')}>
          <span className="brand__mark brand__mark--sm" aria-hidden="true">
            <Icon name="bolt" size={16} strokeWidth={2.4} />
          </span>
          <span className="about__name">{t('common.app.name')}</span>
          <span className="about__version tabular">{t('settings.version', { version: APP_VERSION })}</span>
          <span className="muted small">{t('settings.madeFor')}</span>
        </section>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        tone="danger"
        title={t('settings.import.confirmTitle')}
        message={
          pendingImport
            ? t('settings.import.confirmMessage', {
                date: importDate(pendingImport.exportedAt),
                exercises: pendingImport.data.exercises.length,
                workouts: pendingImport.data.workouts.length,
                plans: pendingImport.data.plans.length,
              })
            : ''
        }
        confirmLabel={t('settings.import.confirm')}
        onCancel={() => setPendingImport(null)}
        onConfirm={doImport}
      />
      <ConfirmDialog
        open={confirmReset}
        tone="danger"
        title={t('settings.reset.confirmTitle')}
        message={t('settings.reset.confirmMessage')}
        confirmLabel={t('settings.reset.confirm')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          doReset();
        }}
      />
    </div>
  );
}
