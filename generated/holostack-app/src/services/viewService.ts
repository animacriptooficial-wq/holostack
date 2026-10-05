import { useUIStore } from '../store';

export const toggleFullView = () => {
  const toggle = useUIStore.getState().toggleFullView;
  toggle();
};

export const isFullViewEnabled = () => {
  return useUIStore.getState().isFullView;
};
