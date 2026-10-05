import { useEffect } from 'react';
import { useCarStore } from '../store';
import { fetchCars } from '../services/carService';

export const useCars = () => {
  const { cars, addCar } = useCarStore();

  useEffect(() => {
    const loadCars = async () => {
      try {
        const carsData = await fetchCars();
        carsData.forEach(addCar);
      } catch (error) {
        console.error('Failed to load cars', error);
      }
    };

    loadCars();
  }, [addCar]);

  return cars;
};
