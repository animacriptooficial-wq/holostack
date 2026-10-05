import { Car } from '../types';

export const fetchCars = async (): Promise<Car[]> => {
  const response = await fetch('/api/cars');
  if (!response.ok) {
    throw new Error('Failed to fetch cars');
  }
  return response.json();
};

export const getCarById = async (id: string): Promise<Car | null> => {
  const response = await fetch(`/api/cars/${id}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};
