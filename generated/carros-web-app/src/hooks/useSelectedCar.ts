import { useCallback } from 'react';
import { useCarStore } from '../store';

export const useSelectedCar = () => {
  const { selectedCar, selectCar } = useCarStore();

  const handleSelectCar = useCallback((carId: string) => {
    selectCar(carId);
  }, [selectCar]);

  return { selectedCar, handleSelectCar };
};
