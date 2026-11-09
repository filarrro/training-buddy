import { useEffect, useRef } from 'react';
import { ToastHost, cx } from '../components';
import { useStorageStatus } from '../data/db';
import { useDocumentLang, useT } from '../i18n';
import { UpdateToast, shouldShowInstallScreen } from '../pwa';
import { InstallScreen } from '../pwa/InstallScreen';
import { LockHintScreen } from '../pwa/LockHintScreen';
import { ConfigScreen } from '../screens/config/ConfigScreen';
import { ExerciseEditorScreen } from '../screens/config/ExerciseEditorScreen';
import { WorkoutEditorScreen } from '../screens/config/WorkoutEditorScreen';
import { PlanEditorScreen } from '../screens/config/PlanEditorScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { PreviewScreen } from '../screens/PreviewScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StartScreen } from '../screens/StartScreen';
import { FinishScreen } from '../session/FinishScreen';
import { SessionScreen } from '../session/SessionScreen';
import { useHydrated } from '../stores/hydration';
import { installHistoryBridge } from './history';
import { nav, useCurrentEntry, useNav } from './nav';
import type { Screen } from './nav';
import { Splash } from './Splash';
import { useThemeEffect } from './theme';
import './app.css';

function renderScreen(screen: Screen) {
  switch (screen.name) {
    case 'start':
      return <StartScreen />;
    case 'plan':
      return <PlanScreen planId={screen.planId} />;
    case 'configPlan':
      return <PlanEditorScreen planId={screen.planId} />;
    case 'preview':
      return <PreviewScreen workoutId={screen.workoutId} />;
    case 'session':
      return <SessionScreen />;
    case 'finish':
      return <FinishScreen />;
    case 'config':
      return <ConfigScreen />;
    case 'configWorkout':
      return <WorkoutEditorScreen workoutId={screen.workoutId} />;
    case 'configExercise':
      return <ExerciseEditorScreen exerciseId={screen.exerciseId} />;
    case 'settings':
      return <SettingsScreen />;
    case 'install':
      return <InstallScreen />;
    case 'lockHint':
      return <LockHintScreen workoutId={screen.workoutId} />;
  }
}

function Shell() {
  const t = useT();
  const entry = useCurrentEntry();
  const direction = useNav((s) => s.direction);
  const storageOk = useStorageStatus((s) => s.available);
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (shouldShowInstallScreen()) nav.reset({ name: 'install' });
    return installHistoryBridge();
  }, []);

  // New screen: scroll to top and move focus for screen readers (not on first paint).
  useEffect(() => {
    window.scrollTo(0, 0);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [entry.key]);

  return (
    <div className="app">
      {!storageOk && (
        <div className="storage-banner" role="status">
          {t('common.storage.unavailable')}
        </div>
      )}
      <main
        ref={mainRef}
        key={entry.key}
        tabIndex={-1}
        className={cx(
          'app-main',
          'screen-enter',
          direction === 'back' && 'screen-enter--back',
          direction === 'fade' && 'screen-enter--fade',
        )}
      >
        {renderScreen(entry.screen)}
      </main>
      <ToastHost />
      <UpdateToast />
    </div>
  );
}

export function App() {
  useDocumentLang();
  useThemeEffect();
  const hydrated = useHydrated();
  return hydrated ? <Shell /> : <Splash />;
}
