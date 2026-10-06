import React from 'react';
import CarCard from './CarCard';

interface Car {
  model: string;
  brand: string;
  price: string;
  imageUrl: string;
}

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', padding: '16px' }}>
      {cars.map((car, index) => (
        <CarCard key={index} {...car} />
      ))}
    </div>
  );
};

export default CarList;