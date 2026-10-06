import { Car } from '../types';

export const fetchCars = async (): Promise<Car[]> => {
  // Simulated data fetching
  return [
    {
      id: '1',
      name: 'Lamborghini Revuelto',
      price: 610000,
      power: '1015 cv',
      engine: 'V12 Híbrido',
      imageUrl: '/images/lamborghini_revuelto.jpg'
    },
    {
      id: '2',
      name: 'Ferrari SF90 Stradale',
      price: 450000,
      power: '1000 cv',
      engine: 'V8 Híbrido',
      imageUrl: '/images/ferrari_sf90.jpg'
    },
    {
      id: '3',
      name: 'Porsche 911 Turbo S',
      price: 203500,
      power: '650 cv',
      engine: '3.8L Twin-Turbo Flat-6',
      imageUrl: '/images/porsche_911_turbo_s.jpg'
    }
  ];
};
