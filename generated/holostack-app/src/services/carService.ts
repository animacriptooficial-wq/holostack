import { Car } from '../types';

const API_URL = 'https://api.example.com/cars';

export const fetchCars = async (): Promise<Car[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch cars');
  }
  return response.json();
};

export const createCar = async (car: Car): Promise<Car> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(car),
  });
  if (!response.ok) {
    throw new Error('Failed to create car');
  }
  return response.json();
};

export const deleteCar = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete car');
  }
};

export const updateCar = async (car: Car): Promise<Car> => {
  const response = await fetch(`${API_URL}/${car.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(car),
  });
  if (!response.ok) {
    throw new Error('Failed to update car');
  }
  return response.json();
};
