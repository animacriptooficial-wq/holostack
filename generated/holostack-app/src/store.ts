import create from 'zustand';

interface UIState {
  isFullView: boolean;
  toggleFullView: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isFullView: false,
  toggleFullView: () => set((state) => ({ isFullView: !state.isFullView })),
}));
