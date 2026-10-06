import React from 'react';
import Header from './components/Header';
import CarList from './components/CarList';

const cars = [
  { model: 'Model S', brand: 'Tesla', price: '$80,000', imageUrl: 'https://example.com/tesla.jpg' },
  { model: 'Ghost', brand: 'Rolls Royce', price: '$300,000', imageUrl: 'https://example.com/rolls.jpg' },
  { model: 'Chiron', brand: 'Bugatti', price: '$3,000,000', imageUrl: 'https://example.com/bugatti.jpg' }
];

const App: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#fff' }}>
      <Header />
      <CarList cars={cars} />
    </div>
  );
};

export default App;