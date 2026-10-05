import React from 'react';
import { Car } from '../types';
import CarCard from './CarCard';
import styles from './CarList.module.css';

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div className={styles.list}>
      {cars.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
};

export default CarList;