import { Car } from '../types';

export const fetchCars = async (): Promise<Car[]> => {
  const response = await fetch('/api/cars');
  if (!response.ok) {
    throw new Error('Failed to fetch cars');
  }
  return response.json();
};

export const createCar = async (car: Car): Promise<Car> => {
  const response = await fetch('/api/cars', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(car),
  });
  if (!response.ok) {
    throw new Error('Failed to create car');
  }
  return response.json();
};

export const deleteCar = async (id: string): Promise<void> => {
  const response = await fetch(`/api/cars/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete car');
  }
};

export const updateCar = async (id: string, updatedCar: Partial<Car>): Promise<Car> => {
  const response = await fetch(`/api/cars/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCar),
  });
  if (!response.ok) {
    throw new Error('Failed to update car');
  }
  return response.json();
};
