import { Car } from '../types';
import { carsData } from '../data/cars';

export const getCarById = (id: string): Car | undefined => {
  return carsData.find(car => car.id === id);
};

export const getCars = (): Car[] => {
  return carsData;
};
