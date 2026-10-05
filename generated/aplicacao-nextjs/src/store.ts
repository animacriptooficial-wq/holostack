import create from 'zustand';

interface AppState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading })
}));
