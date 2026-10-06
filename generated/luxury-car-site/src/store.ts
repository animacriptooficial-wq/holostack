import create from 'zustand';
import { Car } from './types';

interface CarStore {
  cars: Car[];
  selectedCar: Car | null;
  selectCar: (id: string) => void;
  loadCars: (cars: Car[]) => void;
}

export const useCarStore = create<CarStore>((set) => ({
  cars: [],
  selectedCar: null,
  selectCar: (id) => set((state) => ({
    selectedCar: state.cars.find((car) => car.id === id) || null
  })),
  loadCars: (cars) => set(() => ({ cars }))
}));
