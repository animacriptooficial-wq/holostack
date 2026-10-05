import { useEffect } from 'react';
import { useUIStore } from '../store';

export const useFullView = () => {
  const isFullView = useUIStore((state) => state.isFullView);

  useEffect(() => {
    if (isFullView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isFullView]);

  return isFullView;
};
