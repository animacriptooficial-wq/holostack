import React from 'react';
import { Car } from '../types';

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div className="car-list">
      {cars.map((car) => (
        <div key={car.id} className="car-item">
          <h3>{car.model}</h3>
          <p>{car.brand}</p>
          <p>{car.year}</p>
        </div>
      ))}
    </div>
  );
};

export default CarList;
