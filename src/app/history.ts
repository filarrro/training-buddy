/**
 * Bridges system/browser "back" (Android back button, swipe, browser button) to the nav store.
 *
 * Model: history always holds a base entry, plus one "trap" entry while there is somewhere to
 * go back to in-app (stack > 1, or an active session). A popstate means the user pressed back:
 *  - on 'session' → session.requestExitConfirm() (FR16) and the trap is re-armed;
 *  - on 'finish' → reset to start;
 *  - otherwise → nav.back().
 * Registered back guards (app/backGuard.ts: open sheets/dialogs, dirty editors) run first.
 * At the root with no trap, back leaves the app (normal browser/OS behaviour).
 */
import { hasBackGuards, runBackGuards, subscribeBackGuards } from './backGuard';
import { currentScreen, useNav } from './nav';
import { requestExitConfirm } from '../session/store';

const GUARDED = new Set(['session']);

export function installHistoryBridge(): () => void {
  if (typeof window === 'undefined' || !window.history) return () => {};
  let trapArmed = false;

  const needsTrap = () =>
    useNav.getState().stack.length > 1 || GUARDED.has(currentScreen().name) || hasBackGuards();

  const arm = () => {
    if (!trapArmed && needsTrap()) {
      window.history.pushState({ tb: 'trap' }, '');
      trapArmed = true;
    }
  };

  window.history.replaceState({ tb: 'base' }, '');
  arm();

  const onPop = () => {
    trapArmed = false;
    const screen = currentScreen();
    if (runBackGuards()) {
      /* handled by an open sheet/dialog or a dirty form */
    } else if (screen.name === 'session') {
      requestExitConfirm();
    } else if (screen.name === 'finish') {
      useNav.getState().reset();
    } else if (useNav.getState().stack.length > 1) {
      useNav.getState().back();
    }
    arm();
  };

  window.addEventListener('popstate', onPop);
  const unsub = useNav.subscribe(arm);
  const unsubGuards = subscribeBackGuards(arm);
  return () => {
    window.removeEventListener('popstate', onPop);
    unsub();
    unsubGuards();
  };
}
