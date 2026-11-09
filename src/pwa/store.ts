import { create } from 'zustand';

export interface PwaState {
  /** a new Service Worker is installed and waiting (FR35) */
  needRefresh: boolean;
  /** user closed the update banner — hidden until the next launch (D44 applies it then) */
  updateDismissed: boolean;
  /** activates the waiting SW and reloads; set by registerPwa() */
  applyUpdate: (() => void) | null;
  /** Android/Chromium deferred install prompt (FR38) */
  installPrompt: BeforeInstallPromptEvent | null;
  /** user dismissed our install chip (persisted in localStorage) */
  installChipDismissed: boolean;
  /** number of mounted inline <InstallChip/> — the floating fallback hides while > 0 */
  inlineChips: number;
}

const CHIP_KEY = 'tb.installChipDismissed';

function readChipDismissed(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(CHIP_KEY) === '1';
  } catch {
    return false;
  }
}

export const usePwa = create<PwaState>(() => ({
  needRefresh: false,
  updateDismissed: false,
  applyUpdate: null,
  installPrompt: null,
  installChipDismissed: readChipDismissed(),
  inlineChips: 0,
}));

export function dismissUpdate(): void {
  usePwa.setState({ updateDismissed: true });
}

export function dismissInstallChip(): void {
  usePwa.setState({ installChipDismissed: true });
  try {
    localStorage.setItem(CHIP_KEY, '1');
  } catch {
    /* private mode — dismissal lasts for this launch only */
  }
}

/** Show the native install dialog (Android). Clears the prompt: it can be used only once. */
export async function promptInstall(): Promise<boolean> {
  const evt = usePwa.getState().installPrompt;
  if (!evt) return false;
  usePwa.setState({ installPrompt: null });
  try {
    await evt.prompt();
    const choice = await evt.userChoice;
    return choice.outcome === 'accepted';
  } catch {
    return false;
  }
}
