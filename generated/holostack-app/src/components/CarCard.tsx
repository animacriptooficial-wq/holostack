import React from 'react';

interface CarCardProps {
  model: string;
  brand: string;
  price: string;
  imageUrl: string;
}

const CarCard: React.FC<CarCardProps> = ({ model, brand, price, imageUrl }) => {
  return (
    <div style={{ border: '1px solid #444', borderRadius: '8px', padding: '16px', backgroundColor: '#333', color: '#fff', maxWidth: '300px' }}>
      <img src={imageUrl} alt={`${brand} ${model}`} style={{ width: '100%', borderRadius: '8px' }} />
      <h2>{brand} {model}</h2>
      <p>Price: {price}</p>
    </div>
  );
};

export default CarCard;