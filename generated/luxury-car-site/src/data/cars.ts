import { Car } from '../types';

export const cars: Car[] = [
  {
    id: '1',
    name: 'Lamborghini Revuelto',
    price: '€610,000',
    power: '1015 cv V12 híbrido',
    image: '/images/lamborghini-revuelto.jpg',
    description: 'O Lamborghini Revuelto combina potência híbrida com design futurista, oferecendo uma experiência de condução incomparável.'
  },
  {
    id: '2',
    name: 'Ferrari SF90 Stradale',
    price: '€430,000',
    power: '1000 cv V8 híbrido',
    image: '/images/ferrari-sf90-stradale.jpg',
    description: 'A Ferrari SF90 Stradale é a primeira híbrida plug-in da Ferrari, combinando desempenho impressionante com eficiência energética.'
  },
  {
    id: '3',
    name: 'Porsche 911 Turbo S',
    price: '€220,000',
    power: '650 cv 3.8L Boxer',
    image: '/images/porsche-911-turbo-s.jpg',
    description: 'O Porsche 911 Turbo S é a epítome da engenharia automotiva alemã, oferecendo velocidade e luxo em um pacote elegante.'
  }
];