import { useEffect } from 'react';
import { useCarStore } from '../store';
import { fetchCars } from '../services/carService';

export const useCars = () => {
  const { cars, addCar } = useCarStore();

  useEffect(() => {
    const loadCars = async () => {
      try {
        const fetchedCars = await fetchCars();
        fetchedCars.forEach(addCar);
      } catch (error) {
        console.error('Failed to load cars', error);
      }
    };

    loadCars();
  }, [addCar]);

  return cars;
};
