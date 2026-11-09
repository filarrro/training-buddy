import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { currentScreen, nav } from '../app/nav';
import { BUILTIN_EXERCISES, BUILTIN_WORKOUTS, FBW_A_ID } from '../domain/builtins';
import enSession from '../i18n/locales/en/session';
import plSession from '../i18n/locales/pl/session';
import { useSettings } from '../stores/settings';
import { FinishScreen } from './FinishScreen';
import { SessionScreen } from './SessionScreen';
import { ACTION_GUARD_MS, createSession, requestExitConfirm, useSessionStore } from './store';

const fbwA = BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!;

afterEach(cleanup);

beforeEach(async () => {
  await act(async () => {
    useSettings.setState({ lang: 'pl', sound: false });
    nav.reset();
    nav.go({ name: 'session' });
    createSession(structuredClone(fbwA), structuredClone([...BUILTIN_EXERCISES]));
  });
});

describe('SessionScreen', () => {
  it('shows the exercise, then the rest after "Zrobione" (FR10, FR18)', async () => {
    await act(async () => {
      render(<SessionScreen />);
    });
    expect(screen.getByRole('heading', { name: 'Podciąganie nachwytem' })).toBeTruthy();
    expect(screen.getByText('Ćwiczenie 1/5 · Seria 1/4')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Zrobione' })));
    expect(screen.getByText('Przerwa między seriami')).toBeTruthy();
    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('5');
    // Human pace: a second action within ACTION_GUARD_MS is treated as a double tap and ignored.
    const realNow = Date.now;
    Date.now = () => realNow() + ACTION_GUARD_MS + 1;
    try {
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Pomiń przerwę' })));
    } finally {
      Date.now = realNow;
    }
    expect(screen.queryByText('Przerwa między seriami')).toBeNull();
    expect(screen.getByText('Ćwiczenie 1/5 · Seria 2/4')).toBeTruthy();
  });

  it('after the rest ended "Wstecz" is still offered next to "Dalej" (FR14)', async () => {
    await act(async () => {
      render(<SessionScreen />);
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Zrobione' })));
    const s = useSessionStore.getState().session!;
    await act(async () => useSessionStore.setState({ session: { ...s, endsAt: Date.now() - 1000, phase: 'restDone' } }));
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeTruthy();
    const realNow = Date.now;
    Date.now = () => realNow() + ACTION_GUARD_MS + 1;
    try {
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Wstecz' })));
    } finally {
      Date.now = realNow;
    }
    expect(screen.getByText('Ćwiczenie 1/5 · Seria 1/4')).toBeTruthy();
    expect(useSessionStore.getState().session!.statuses[0]).toBe('todo');
  });

  it('system back asks for confirmation; confirming ends early → finish without confetti (FR16, FR21)', async () => {
    await act(async () => {
      render(<SessionScreen />);
    });
    await act(async () => requestExitConfirm());
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Zakończ' })));
    expect(useSessionStore.getState().session?.endedEarly).toBe(true);
    expect(currentScreen().name).toBe('finish');
    cleanup();
    await act(async () => {
      render(<FinishScreen />);
    });
    expect(screen.getByText('Trening zakończony')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Wróć do startu' })));
    expect(currentScreen().name).toBe('start');
    expect(useSessionStore.getState().session).toBeNull();
  });
});

describe('session i18n', () => {
  it('PL and EN have the same keys', () => {
    expect(Object.keys(enSession).sort()).toEqual(Object.keys(plSession).sort());
  });
});
