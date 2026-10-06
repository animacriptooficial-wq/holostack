import React from 'react';
import { Car } from '../types';
import CarCard from './CarCard';

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      {cars.map(car => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
};

export default CarList;