import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nav, useNav } from '../../app/nav';
import { FBW_A_ID } from '../../domain/builtins';
import type { Exercise } from '../../domain/types';
import { useSettings } from '../../stores/settings';
import { getWorkout, useLibrary } from '../../stores/library';
import { ConfigScreen } from './ConfigScreen';
import { ExerciseEditorScreen } from './ExerciseEditorScreen';
import { WorkoutEditorScreen } from './WorkoutEditorScreen';
import { useConfigUi } from './configUi';

const row: Exercise = {
  id: 'ex-row',
  builtIn: false,
  name: 'Wiosłowanie',
  category: 'pull',
  unilateral: false,
  defaultSets: 3,
  defaultTarget: { type: 'reps', min: 8, max: 12 },
};

beforeEach(async () => {
  await act(async () => {
    useSettings.getState().setLang('pl');
    useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
    useConfigUi.setState({ tab: 'workouts', highlightId: null });
    nav.reset({ name: 'config' });
  });
});
afterEach(cleanup);

const click = async (el: Element) => act(async () => void fireEvent.click(el));
const type = async (el: Element, value: string) => act(async () => void fireEvent.change(el, { target: { value } }));

describe('ConfigScreen', () => {
  it('lists built-in workouts and switches to the exercise library grouped by category', async () => {
    render(<ConfigScreen />);
    expect(screen.getByText('FBW A')).toBeTruthy();
    await click(screen.getByRole('radio', { name: /Ćwiczenia/ }));
    expect(screen.getByText('Podciąganie nachwytem')).toBeTruthy();
    expect(screen.getByText('Tył uda i pośladki')).toBeTruthy();
  });

  it('duplicates a workout with "(kopia)" then "(kopia 2)" (BR10)', async () => {
    render(<ConfigScreen />);
    await click(screen.getByRole('button', { name: 'Duplikuj: FBW A' }));
    await click(screen.getByRole('button', { name: 'Duplikuj: FBW A' }));
    const names = useLibrary.getState().workouts.map((w) => w.name);
    expect(names).toEqual(['FBW A (kopia)', 'FBW A (kopia 2)']);
  });
});

describe('WorkoutEditorScreen', () => {
  it('blocks saving without exercises, then saves a new workout', async () => {
    render(<WorkoutEditorScreen />);
    await type(screen.getByLabelText('Nazwa'), 'Góra');
    await click(screen.getByRole('button', { name: 'Zapisz' }));
    expect(screen.getAllByText('Dodaj co najmniej jedno ćwiczenie').length).toBeGreaterThan(0);
    expect(useLibrary.getState().workouts).toHaveLength(0);

    await click(screen.getByRole('button', { name: 'Dodaj ćwiczenie' }));
    await click(within(screen.getByRole('dialog')).getByText('Dipy (pompki na poręczach)'));
    await click(screen.getByRole('button', { name: 'Zapisz' }));
    const [w] = useLibrary.getState().workouts;
    expect(w).toMatchObject({ name: 'Góra', mode: 'straight', builtIn: false });
    expect(w!.items).toEqual([{ exerciseId: 'builtin:dips', sets: 4, target: { type: 'reps', min: 5, max: 7 } }]);
  });

  it('rejects a duplicate name case-insensitively (D45)', async () => {
    await act(async () =>
      useLibrary.getState().saveWorkout({ ...getWorkout(FBW_A_ID)!, id: 'w1', builtIn: false, name: 'Góra' }),
    );
    render(<WorkoutEditorScreen />);
    await type(screen.getByLabelText('Nazwa'), 'góra');
    expect(screen.getByText('Ta nazwa jest już zajęta')).toBeTruthy();
  });

  it('edits FBW A without renaming it, then restores defaults (FR26, BR11)', async () => {
    await act(async () => nav.go({ name: 'configWorkout', workoutId: FBW_A_ID }));
    render(<WorkoutEditorScreen workoutId={FBW_A_ID} />);
    await click(screen.getAllByRole('button', { name: /Usuń z treningu/ })[4]!);
    await click(screen.getByRole('button', { name: 'Zapisz' }));
    const stored = useLibrary.getState().workouts.find((w) => w.id === FBW_A_ID)!;
    expect(stored.items).toHaveLength(4);
    expect(stored.name).toBeUndefined();
    cleanup();

    render(<WorkoutEditorScreen workoutId={FBW_A_ID} />);
    await click(screen.getByRole('button', { name: 'Przywróć domyślne' }));
    await click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Przywróć domyślne' }));
    expect(useLibrary.getState().workouts).toHaveLength(0);
    expect(getWorkout(FBW_A_ID)!.items).toHaveLength(5);
  });

  it('shows the empty hint for a workout left without exercises (EC10)', async () => {
    await act(async () =>
      useLibrary.getState().saveWorkout({ ...getWorkout(FBW_A_ID)!, id: 'w-empty', builtIn: false, name: 'Pusty', items: [] }),
    );
    render(<WorkoutEditorScreen workoutId="w-empty" />);
    expect(screen.getByText(/Ten trening nie ma ćwiczeń/)).toBeTruthy();
  });
});

describe('ExerciseEditorScreen', () => {
  it('creates a custom exercise', async () => {
    render(<ExerciseEditorScreen />);
    await type(screen.getByLabelText('Nazwa'), 'Wiosłowanie australijskie');
    await click(screen.getByRole('radio', { name: 'Czas' }));
    await click(screen.getByRole('button', { name: 'Zapisz' }));
    const [ex] = useLibrary.getState().exercises;
    expect(ex).toMatchObject({ name: 'Wiosłowanie australijskie', category: 'pull', builtIn: false });
    expect(ex!.defaultTarget).toEqual({ type: 'time', minSec: 30, maxSec: 60, targetSec: 30 });
  });

  it('type change of a used exercise asks for confirmation and replaces item targets (D34, AC18)', async () => {
    await act(async () => {
      useLibrary.getState().saveExercise(row);
      useLibrary.getState().saveWorkout({
        ...getWorkout(FBW_A_ID)!,
        id: 'w1',
        builtIn: false,
        name: 'Góra',
        items: [{ exerciseId: row.id, sets: 5, target: { type: 'reps', min: 6, max: 6 } }],
      });
    });
    render(<ExerciseEditorScreen exerciseId={row.id} />);
    await click(screen.getByRole('radio', { name: 'Czas' }));
    await click(screen.getByRole('button', { name: 'Zapisz' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Użyte w 1 treningu — cel zostanie zastąpiony domyślnym.')).toBeTruthy();
    await click(within(dialog).getByRole('button', { name: 'Zmień i zapisz' }));
    const item = getWorkout('w1')!.items[0]!;
    expect(item.sets).toBe(5);
    expect(item.target).toEqual({ type: 'time', minSec: 30, maxSec: 60, targetSec: 30 });
  });

  it('deletes an exercise from all workouts, leaving an empty workout (D33, AC17)', async () => {
    await act(async () => {
      useLibrary.getState().saveExercise(row);
      useLibrary.getState().saveWorkout({
        ...getWorkout(FBW_A_ID)!,
        id: 'w1',
        builtIn: false,
        name: 'Góra',
        items: [{ exerciseId: row.id, sets: 3, target: { type: 'reps', min: 8, max: 12 } }],
      });
    });
    render(<ExerciseEditorScreen exerciseId={row.id} />);
    await click(screen.getByRole('button', { name: 'Usuń ćwiczenie' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Góra')).toBeTruthy();
    await click(within(dialog).getByRole('button', { name: 'Usuń' }));
    expect(useLibrary.getState().exercises).toHaveLength(0);
    expect(getWorkout('w1')!.items).toEqual([]);
  });

  it('built-in exercise is read-only and can be duplicated (FR24)', async () => {
    render(<ExerciseEditorScreen exerciseId="builtin:plank" />);
    expect((screen.getByLabelText('Nazwa') as HTMLInputElement).disabled).toBe(true);
    await click(screen.getByRole('button', { name: 'Duplikuj' }));
    expect(useLibrary.getState().exercises[0]!.name).toBe('Plank (deska) (kopia)');
    const top = useNav.getState().stack.at(-1)!.screen;
    expect(top).toMatchObject({ name: 'configExercise', exerciseId: useLibrary.getState().exercises[0]!.id });
  });
});
