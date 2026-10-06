import { Car } from '../types';

export const cars: Car[] = [
  {
    id: '1',
    name: 'Lamborghini Revuelto',
    price: '€610,000',
    power: '1015 cv',
    engine: 'V12 híbrido',
    imageUrl: '/images/lamborghini-revuelto.jpg'
  },
  {
    id: '2',
    name: 'Ferrari SF90 Stradale',
    price: '€430,000',
    power: '1000 cv',
    engine: 'V8 híbrido plug-in',
    imageUrl: '/images/ferrari-sf90.jpg'
  },
  {
    id: '3',
    name: 'Porsche 911 Turbo S',
    price: '€220,000',
    power: '650 cv',
    engine: '3.8L twin-turbo flat-six',
    imageUrl: '/images/porsche-911-turbo-s.jpg'
  }
];