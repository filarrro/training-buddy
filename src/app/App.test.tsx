import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSettings } from '../stores/settings';
import { waitForHydration } from '../stores/hydration';
import { App } from './App';
import { nav } from './nav';

afterEach(cleanup);

async function renderApp() {
  await act(async () => {
    render(<App />);
    await waitForHydration();
  });
}

describe('App shell', () => {
  it('renders the start screen after hydration and switches language without reload (FR39)', async () => {
    await renderApp();
    expect(await screen.findByText('FBW A')).toBeTruthy();
    await act(async () => useSettings.getState().setLang('pl'));
    expect(document.documentElement.lang).toBe('pl');
    await act(async () => useSettings.getState().setLang('en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('navigates plan → workout → preview on card taps', async () => {
    await renderApp();
    await act(async () => nav.reset());
    fireEvent.click(await screen.findByText('FBW · bodyweight'));
    fireEvent.click(await screen.findByText('FBW B · bodyweight'));
    expect(await screen.findByRole('button', { name: /start/i })).toBeTruthy();
  });
});
