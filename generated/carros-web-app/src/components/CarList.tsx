import React from 'react';
import { useCars } from '../hooks/useCars';
import { Link } from 'react-router-dom';

export const CarList = () => {
  const { cars } = useCars();

  return (
    <div className="car-list">
      <h1>Carros Disponíveis</h1>
      <ul>
        {cars.map(car => (
          <li key={car.id}>
            <Link to={`/car/${car.id}`}>{car.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
