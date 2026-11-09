/// <reference types="vite-plugin-pwa/client" />

/** Chromium-only install prompt event (FR38). Not in lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
}

interface Navigator {
  /** iOS Safari: true when launched from the home screen */
  readonly standalone?: boolean;
}
