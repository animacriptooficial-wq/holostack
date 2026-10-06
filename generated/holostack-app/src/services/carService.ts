import { Car } from '../types';

export const fetchLuxuryCars = async (): Promise<Car[]> => {
  // This would be replaced with an actual API call
  return [
    { id: '1', brand: 'Ferrari', model: '488 GTB', year: 2020, price: 250000 },
    { id: '2', brand: 'Lamborghini', model: 'Huracan', year: 2021, price: 300000 },
    { id: '3', brand: 'Porsche', model: '911 Turbo S', year: 2021, price: 200000 }
  ];
};

export const fetchCarById = async (id: string): Promise<Car | undefined> => {
  const cars = await fetchLuxuryCars();
  return cars.find(car => car.id === id);
};
