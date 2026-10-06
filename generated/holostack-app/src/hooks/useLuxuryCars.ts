import { useEffect } from 'react';
import { useCarStore } from '../store';
import { fetchLuxuryCars } from '../services/carService';

export const useLuxuryCars = () => {
  const cars = useCarStore(state => state.cars);
  const addCar = useCarStore(state => state.addCar);

  useEffect(() => {
    const loadCars = async () => {
      const luxuryCars = await fetchLuxuryCars();
      luxuryCars.forEach(car => addCar(car));
    };

    loadCars();
  }, [addCar]);

  return cars;
};
