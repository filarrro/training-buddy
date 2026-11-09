import { clear, createStore } from 'idb-keyval';
import { DB_NAME, STORE_NAME } from '../../data/db';
import { useLibrary } from '../../stores/library';
import { useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/**
 * Resets the app to its first-launch state (FR29): resets the in-memory stores, clears the whole
 * IndexedDB key-value store (library, settings, ui and any later keys) and reloads the page.
 */
export async function resetAllData(): Promise<void> {
  useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
  useSettings.getState().reset();
  useUi.setState({ lockHintSeen: false, installScreenSeen: false });
  try {
    if (typeof indexedDB !== 'undefined') {
      await Promise.race([
        clear(createStore(DB_NAME, STORE_NAME)),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch (e) {
    console.warn('[settings] reset: clearing IndexedDB failed', e);
  }
  window.location.reload();
}
