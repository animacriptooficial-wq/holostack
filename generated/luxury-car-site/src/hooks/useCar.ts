import { useCarStore } from '../store';

export const useCar = () => {
  const { selectedCar, selectCar } = useCarStore();

  return {
    selectedCar,
    selectCar
  };
};
