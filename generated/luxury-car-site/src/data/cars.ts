import { Car } from '../types';

export const cars: Car[] = [
  {
    id: '1',
    name: 'Lamborghini Revuelto',
    price: '€610,000',
    horsepower: '1015 cv',
    engine: 'V12 híbrido',
    image: '/images/lamborghini-revuelto.jpg',
    description: 'O Lamborghini Revuelto é um supercarro híbrido com um motor V12 e potência impressionante de 1015 cv, combinando luxo e desempenho incomparável.'
  },
  {
    id: '2',
    name: 'Ferrari SF90 Stradale',
    price: '€450,000',
    horsepower: '1000 cv',
    engine: 'V8 híbrido',
    image: '/images/ferrari-sf90-stradale.jpg',
    description: 'A Ferrari SF90 Stradale é um supercarro inovador com um motor V8 híbrido, oferecendo uma potência total de 1000 cv e uma experiência de condução extraordinária.'
  },
  {
    id: '3',
    name: 'Porsche 911 GT3 RS',
    price: '€230,000',
    horsepower: '525 cv',
    engine: 'Flat-6',
    image: '/images/porsche-911-gt3-rs.jpg',
    description: 'O Porsche 911 GT3 RS é um carro desportivo de alta performance com um motor Flat-6, concebido para proporcionar uma experiência de condução emocionante com 525 cv.'
  }
];
