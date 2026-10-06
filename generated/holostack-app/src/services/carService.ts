import { Car } from '../types';

export const fetchCars = async (): Promise<Car[]> => {
  // Simulate fetching data from an API
  return [
    {
      id: 1,
      name: 'Luxury Sedan',
      brand: 'Brand A',
      price: 75000,
      image: '/images/luxury-sedan.jpg',
    },
    {
      id: 2,
      name: 'Luxury SUV',
      brand: 'Brand B',
      price: 95000,
      image: '/images/luxury-suv.jpg',
    },
  ];
};

export const fetchCarById = async (id: number): Promise<Car | undefined> => {
  const cars = await fetchCars();
  return cars.find((car) => car.id === id);
};
