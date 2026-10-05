import create from 'zustand';
import { Car } from './types';

interface CarState {
  cars: Car[];
  selectedCar: Car | null;
  addCar: (car: Car) => void;
  selectCar: (carId: string) => void;
}

export const useCarStore = create<CarState>((set) => ({
  cars: [],
  selectedCar: null,
  addCar: (car) => set((state) => ({ cars: [...state.cars, car] })),
  selectCar: (carId) =>
    set((state) => ({ selectedCar: state.cars.find((car) => car.id === carId) || null })),
}));
