import React from 'react';
import { Car } from '../types';
import './CarList.css';

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div className="car-list">
      {cars.map((car) => (
        <div key={car.id} className="car-item">
          <h2>{car.make} {car.model}</h2>
          <p>Year: {car.year}</p>
          <p>Price: ${car.price}</p>
        </div>
      ))}
    </div>
  );
};

export default CarList;
