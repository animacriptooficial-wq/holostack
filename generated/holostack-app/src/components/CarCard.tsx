import React from 'react';
import { Car } from '../types';

interface CarCardProps {
  car: Car;
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  return (
    <div style={{ border: '1px solid #333', padding: '10px', borderRadius: '5px', margin: '10px', backgroundColor: '#1e1e1e', color: '#fff' }}>
      <h2>{car.make} {car.model}</h2>
      <p>Year: {car.year}</p>
      <p>Price: ${car.price.toLocaleString()}</p>
      <img src={car.image} alt={`${car.make} ${car.model}`} style={{ width: '100%', borderRadius: '5px' }} />
    </div>
  );
};

export default CarCard;