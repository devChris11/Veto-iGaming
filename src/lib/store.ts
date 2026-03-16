/**
 * Zustand store for betting slip state management.
 * Manages selections, stake updates, and slip lifecycle for the Finnish iGaming application.
 */

import { create } from "zustand";
import type { Selection } from "@/types/betting";

/**
 * Betting store interface defining state and actions for the betting slip.
 */
export interface BettingStore {
  /** Current selections in the betting slip */
  selections: Selection[];
  /** Add a selection to the slip */
  addSelection: (selection: Selection) => void;
  /** Remove a selection by id */
  removeSelection: (id: string) => void;
  /** Update stake for a specific selection by id */
  updateStake: (id: string, stake: number) => void;
  /** Clear all selections from the slip */
  clearSelections: () => void;
}

export const useBettingStore = create<BettingStore>((set) => ({
  selections: [],

  addSelection: (selection) =>
    set((state) => ({
      selections: [...state.selections, selection],
    })),

  removeSelection: (id) =>
    set((state) => ({
      selections: state.selections.filter((s) => s.id !== id),
    })),

  updateStake: (id, stake) =>
    set((state) => ({
      selections: state.selections.map((s) =>
        s.id === id ? { ...s, stake } : s
      ),
    })),

  clearSelections: () => set({ selections: [] }),
}));
