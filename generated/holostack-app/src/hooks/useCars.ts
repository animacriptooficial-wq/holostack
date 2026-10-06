import { useEffect } from 'react';
import { useCarStore } from '../store';
import { fetchCars } from '../services/carService';

export const useCars = () => {
  const { cars, addCar } = useCarStore();

  useEffect(() => {
    const loadCars = async () => {
      const carsData = await fetchCars();
      carsData.forEach((car) => addCar(car));
    };
    loadCars();
  }, [addCar]);

  return { cars };
};
