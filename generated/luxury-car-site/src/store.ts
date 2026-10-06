import create from 'zustand';
import { Car } from './types';
import { carsData } from './data/cars';

interface CarStore {
  cars: Car[];
  selectedCar: Car | null;
  selectCar: (id: string) => void;
}

export const useCarStore = create<CarStore>((set) => ({
  cars: carsData,
  selectedCar: null,
  selectCar: (id: string) => {
    set((state) => ({
      selectedCar: state.cars.find((car) => car.id === id) || null
    }));
  }
}));
