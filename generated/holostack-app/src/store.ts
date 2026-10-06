import create from 'zustand';

interface Car {
  id: number;
  name: string;
  brand: string;
  price: number;
  image: string;
}

interface CarStore {
  cars: Car[];
  addCar: (car: Car) => void;
  removeCar: (id: number) => void;
  updateCar: (updatedCar: Car) => void;
}

export const useCarStore = create<CarStore>((set) => ({
  cars: [],
  addCar: (car) => set((state) => ({ cars: [...state.cars, car] })),
  removeCar: (id) => set((state) => ({ cars: state.cars.filter((car) => car.id !== id) })),
  updateCar: (updatedCar) => set((state) => ({
    cars: state.cars.map((car) => (car.id === updatedCar.id ? updatedCar : car)),
  })),
}));
