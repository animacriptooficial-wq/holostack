import { useEffect } from 'react';
import { fetchCars } from '../services/carService';
import { useCarStore } from '../store';

export const useCarData = () => {
  const { loadCars } = useCarStore();

  useEffect(() => {
    const load = async () => {
      const cars = await fetchCars();
      loadCars(cars);
    };

    load();
  }, [loadCars]);
};
