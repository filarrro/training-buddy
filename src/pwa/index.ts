/**
 * PWA integration (T8): Service Worker registration + update banner, install screen (iOS),
 * lock hint, Android install chip and persistent storage request.
 */
import { useUi } from '../stores/ui';
import { isIosBrowser } from './platform';

export { registerPwa } from './register';
export { UpdateToast } from './UpdateToast';
export { InstallChip } from './InstallChip';
export { usePwa, promptInstall } from './store';
export { isIos, isIosBrowser, isStandalone } from './platform';

/**
 * FR36: first launch in an iOS browser (not from the Home Screen) and the install screen not yet seen.
 * Called by App once after hydration; never true in the installed app.
 */
export function shouldShowInstallScreen(): boolean {
  return !useUi.getState().installScreenSeen && isIosBrowser();
}
