/** Transient (non-persisted) UI state of the configurator that must survive editor round-trips. */
import { create } from 'zustand';

export type ConfigTab = 'plans' | 'workouts' | 'exercises';

interface ConfigUiState {
  tab: ConfigTab;
  /** id of a row to highlight once (just created / duplicated / saved) */
  highlightId: string | null;
  setTab: (tab: ConfigTab) => void;
  highlight: (id: string | null) => void;
}

export const useConfigUi = create<ConfigUiState>((set) => ({
  tab: 'plans',
  highlightId: null,
  setTab: (tab) => set({ tab }),
  highlight: (highlightId) => set({ highlightId }),
}));
