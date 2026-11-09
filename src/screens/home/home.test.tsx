import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nav, useNav } from '../../app/nav';
import { FBW_A_ID } from '../../domain/builtins';
import { getWorkout, useLibrary } from '../../stores/library';
import { useSettings } from '../../stores/settings';
import { PreviewScreen } from '../PreviewScreen';
import { SettingsScreen } from '../SettingsScreen';
import { StartScreen } from '../StartScreen';

afterEach(cleanup);

beforeEach(async () => {
  await act(async () => {
    useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
    useSettings.setState({ lang: 'pl' });
    nav.reset();
  });
});

describe('StartScreen', () => {
  it('lists the built-in plans with their workouts and the suggested next one', async () => {
    await act(async () => {
      render(<StartScreen />);
    });
    expect(screen.getByText('FBW · z obciążeniem')).toBeTruthy();
    expect(screen.getByText('FBW · ekspres')).toBeTruthy();
    expect(screen.getByText('FBW · masa ciała')).toBeTruthy();
    expect(screen.getByText('FBW A · masa ciała')).toBeTruthy();
    expect(screen.getByText('Następny: FBW A · masa ciała')).toBeTruthy();
    expect(screen.getByText('Split góra/dół')).toBeTruthy();
    expect(screen.getAllByText('2 treningi')).toHaveLength(4);
    expect(screen.getByText('Push / Pull / Legs')).toBeTruthy();
    expect(screen.getByText('3 treningi')).toBeTruthy();
  });

  it('lists a custom workout outside plans with exercise count, mode and estimate (FR3, FR5)', async () => {
    await act(async () => {
      useLibrary.getState().saveWorkout({ ...getWorkout(FBW_A_ID)!, id: 'w2', builtIn: false, name: 'Mój' });
      render(<StartScreen />);
    });
    expect(screen.getByText('Mój')).toBeTruthy();
    expect(screen.getByText('5 ćwiczeń')).toBeTruthy();
    expect(screen.getByText('Klasyczny')).toBeTruthy();
    expect(screen.getAllByText(/^~\d+ min$/)).toHaveLength(1);
  });

  it('opens the editor instead of the preview for a workout without exercises', async () => {
    await act(async () => {
      useLibrary.getState().saveWorkout({ ...getWorkout(FBW_A_ID)!, id: 'w1', builtIn: false, name: 'Pusty', items: [] });
      render(<StartScreen />);
    });
    expect(screen.getByText('Brak ćwiczeń')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Pusty')));
    expect(useNav.getState().stack.at(-1)?.screen).toEqual({ name: 'configWorkout', workoutId: 'w1' });
  });
});

describe('PreviewScreen', () => {
  it('shows the plan in order with sets × target and the time range hint (FR7)', async () => {
    await act(async () => {
      render(<PreviewScreen workoutId={FBW_A_ID} />);
    });
    expect(screen.getAllByText('4 × 5–7 powt.')).toHaveLength(2);
    expect(screen.getByText('3 × 6–8 powt. na nogę')).toBeTruthy();
    expect(screen.getByText('3 × 45 s')).toBeTruthy();
    expect(screen.getByText('zakres 45–60 s')).toBeTruthy();
  });

  it('switches mode and keeps each mode rest values (FR8, D17)', async () => {
    await act(async () => {
      render(<PreviewScreen workoutId={FBW_A_ID} />);
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Zwiększ: Między seriami' })),
    );
    expect(getWorkout(FBW_A_ID)!.rest.straight.betweenSetsSec).toBe(105);

    await act(async () => fireEvent.click(screen.getByRole('radio', { name: 'Obwód' })));
    expect(getWorkout(FBW_A_ID)!.mode).toBe('circuit');
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Zmniejsz: Między ćwiczeniami w rundzie' })),
    );
    expect(getWorkout(FBW_A_ID)!.rest.circuit.betweenExercisesSec).toBe(25);
    expect(screen.getByText('4 rundy')).toBeTruthy();

    await act(async () => fireEvent.click(screen.getByRole('radio', { name: 'Klasyczny' })));
    expect(getWorkout(FBW_A_ID)!.rest.straight.betweenSetsSec).toBe(105);
    expect(screen.getByText('1:45')).toBeTruthy();
  });

  it('disables Start for a workout without exercises', async () => {
    await act(async () => {
      useLibrary.getState().updateWorkout(FBW_A_ID, { items: [] });
      render(<PreviewScreen workoutId={FBW_A_ID} />);
    });
    const start = screen.getByRole('button', { name: 'Start' }) as HTMLButtonElement;
    expect(start.disabled).toBe(true);
  });
});

describe('SettingsScreen', () => {
  it('switches language instantly and toggles sound (FR28, FR39)', async () => {
    await act(async () => {
      render(<SettingsScreen />);
    });
    expect(screen.getByRole('heading', { name: 'Ustawienia' })).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole('radio', { name: 'English' })));
    expect(useSettings.getState().lang).toBe('en');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();

    const sw = screen.getByRole('switch', { name: /Sound/ });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    await act(async () => fireEvent.click(sw));
    expect(useSettings.getState().sound).toBe(false);
  });
});
