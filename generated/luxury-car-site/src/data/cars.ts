import { Car } from '../types';

export const cars: Car[] = [
  {
    id: '1',
    name: 'Lamborghini Revuelto',
    price: '€610,000',
    horsepower: 1015,
    engine: 'V12 híbrido',
    imageUrl: '/images/lamborghini-revuelto.jpg'
  },
  {
    id: '2',
    name: 'Ferrari SF90 Stradale',
    price: '€430,000',
    horsepower: 986,
    engine: 'V8 híbrido',
    imageUrl: '/images/ferrari-sf90-stradale.jpg'
  },
  {
    id: '3',
    name: 'Porsche 911 Turbo S',
    price: '€216,000',
    horsepower: 640,
    engine: '3.8L Flat-6',
    imageUrl: '/images/porsche-911-turbo-s.jpg'
  }
];