import { Car } from '../types';

export const cars: Car[] = [
  {
    id: '1',
    name: 'Lamborghini Revuelto',
    price: '€610,000',
    horsepower: 1015,
    engine: 'V12 híbrido',
    imageUrl: '/images/lamborghini-revuelto.jpg',
  },
  {
    id: '2',
    name: 'Ferrari SF90 Stradale',
    price: '€430,000',
    horsepower: 1000,
    engine: 'V8 híbrido',
    imageUrl: '/images/ferrari-sf90-stradale.jpg',
  },
  {
    id: '3',
    name: 'Bugatti Chiron',
    price: '€2,400,000',
    horsepower: 1500,
    engine: 'W16 quad-turbo',
    imageUrl: '/images/bugatti-chiron.jpg',
  }
];