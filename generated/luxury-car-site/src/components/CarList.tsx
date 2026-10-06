import React from 'react';
import { Car } from '../types';

interface CarListProps {
  cars: Car[];
}

const CarList: React.FC<CarListProps> = ({ cars }) => {
  return (
    <div style={styles.listContainer}>
      {cars.map((car) => (
        <div key={car.id} style={styles.carCard}>
          <h2 style={styles.carName}>{car.name}</h2>
          <p style={styles.carDescription}>{car.description}</p>
        </div>
      ))}
    </div>
  );
};

const styles = {
  listContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    marginTop: '20px',
  },
  carCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    margin: '10px',
    padding: '15px',
    width: '200px',
    textAlign: 'center' as const,
  },
  carName: {
    fontSize: '18px',
    margin: '10px 0',
  },
  carDescription: {
    fontSize: '14px',
  },
};

export default CarList;
