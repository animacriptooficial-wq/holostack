import React from 'react';
import styles from './CarCard.module.css';
import { Car } from '../types';

interface CarCardProps {
  car: Car;
}

const CarCard: React.FC<CarCardProps> = ({ car }) => {
  return (
    <div className={styles.card}>
      <img src={car.image} alt={car.model} className={styles.image} />
      <div className={styles.details}>
        <h2 className={styles.model}>{car.model}</h2>
        <p className={styles.price}>${car.price}</p>
      </div>
    </div>
  );
};

export default CarCard;