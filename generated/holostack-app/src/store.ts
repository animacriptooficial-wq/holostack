import create from 'zustand';
import { Car } from './types';

interface CarStore {
  cars: Car[];
  addCar: (car: Car) => void;
  removeCar: (id: string) => void;
  updateCar: (id: string, updatedCar: Partial<Car>) => void;
}

export const useCarStore = create<CarStore>((set) => ({
  cars: [],
  addCar: (car) => set((state) => ({ cars: [...state.cars, car] })),
  removeCar: (id) => set((state) => ({ cars: state.cars.filter((car) => car.id !== id) })),
  updateCar: (id, updatedCar) => set((state) => ({
    cars: state.cars.map((car) => (car.id === id ? { ...car, ...updatedCar } : car)),
  })),
}));
