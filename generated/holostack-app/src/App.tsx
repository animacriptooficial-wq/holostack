import React from 'react';
import CarList from './components/CarList';
import Header from './components/Header';
import { useCars } from './hooks/useCars';

const App: React.FC = () => {
  const { cars } = useCars();

  return (
    <div className="app">
      <Header />
      <CarList cars={cars} />
    </div>
  );
};

export default App;
