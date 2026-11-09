import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentScreen, nav } from '../app/nav';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import { InstallScreen } from './InstallScreen';
import { LockHintScreen } from './LockHintScreen';
import { isIos, isIosBrowser, isStandalone } from './platform';
import { usePwa } from './store';
import { SESSION_NOTICE_MS, UpdateToast } from './UpdateToast';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

afterEach(cleanup);
beforeEach(async () => {
  await act(async () => {
    nav.reset();
    useSettings.getState().setLang('pl');
    useUi.setState({ lockHintSeen: false, installScreenSeen: false });
    usePwa.setState({ needRefresh: false, updateDismissed: false, applyUpdate: null, inlineChips: 0 });
  });
});

describe('platform detection (FR36)', () => {
  it('detects iPhone and iPadOS (desktop UA with touch), not Android or a Mac', () => {
    expect(isIos({ userAgent: IPHONE })).toBe(true);
    expect(isIos({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isIos({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    expect(isIos({ userAgent: ANDROID, maxTouchPoints: 5 })).toBe(false);
  });

  it('never offers the install screen in the installed app', () => {
    expect(isIosBrowser({ userAgent: IPHONE, standalone: false })).toBe(true);
    expect(isIosBrowser({ userAgent: IPHONE, standalone: true })).toBe(false);
    expect(isIosBrowser({ userAgent: IPHONE, displayModeStandalone: true })).toBe(false);
    expect(isStandalone({ userAgent: ANDROID, displayModeStandalone: true })).toBe(true);
  });
});

describe('InstallScreen / LockHintScreen', () => {
  it('"Kontynuuj w przeglądarce" marks install + lock hint as seen and goes to start (FR36, FR37)', async () => {
    await act(async () => nav.reset({ name: 'install' }));
    render(<InstallScreen />);
    expect(screen.getByText(/nie przejdą do aplikacji/)).toBeTruthy();
    expect(screen.getByText(/Nie blokuj telefonu w trakcie treningu/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Kontynuuj w przeglądarce' })));
    expect(useUi.getState()).toMatchObject({ installScreenSeen: true, lockHintSeen: true });
    expect(currentScreen().name).toBe('start');
  });

  it('"Rozumiem, zaczynamy" marks the hint seen and replaces it with the session', async () => {
    await act(async () => nav.go({ name: 'lockHint', workoutId: 'builtin:fbw-a' }));
    render(<LockHintScreen workoutId="builtin:fbw-a" />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Rozumiem, zaczynamy/ })));
    expect(useUi.getState().lockHintSeen).toBe(true);
    expect(currentScreen().name).toBe('session');
  });
});

describe('UpdateToast (FR35, D44)', () => {
  it('shows the update banner outside a session; during one only a notice without Refresh (EC19)', async () => {
    let applied = 0;
    await act(async () => usePwa.setState({ needRefresh: true, applyUpdate: () => applied++ }));
    render(<UpdateToast />);
    expect(screen.getByText('Dostępna nowa wersja')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Odśwież' }));
    expect(applied).toBe(1);

    await act(async () => nav.go({ name: 'session' }));
    expect(screen.getByText('Dostępna nowa wersja')).toBeTruthy();
    expect(screen.getByText(/odświeżysz po jego zakończeniu/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Odśwież' })).toBeNull();
    expect(applied).toBe(1);

    await act(async () => nav.reset());
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Później' })));
    expect(screen.queryByText('Dostępna nowa wersja')).toBeNull();
  });

  it('the in-session notice hides itself and the actionable banner returns after the session', async () => {
    vi.useFakeTimers();
    try {
      await act(async () => {
        usePwa.setState({ needRefresh: true, applyUpdate: () => {} });
        nav.go({ name: 'session' });
      });
      render(<UpdateToast />);
      expect(screen.getByText('Dostępna nowa wersja')).toBeTruthy();
      await act(async () => vi.advanceTimersByTime(SESSION_NOTICE_MS + 10));
      expect(screen.queryByText('Dostępna nowa wersja')).toBeNull();
      await act(async () => nav.reset());
      expect(screen.getByRole('button', { name: 'Odśwież' })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
