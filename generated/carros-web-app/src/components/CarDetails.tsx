import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelectedCar } from '../hooks/useSelectedCar';

export const CarDetails = () => {
  const { id } = useParams();
  const { car } = useSelectedCar(id);

  if (!car) return <div>Carregando...</div>;

  return (
    <div className="car-details">
      <h2>{car.name}</h2>
      <p>Marca: {car.brand}</p>
      <p>Modelo: {car.model}</p>
      <p>Ano: {car.year}</p>
      <p>Preço: {car.price}</p>
    </div>
  );
};
