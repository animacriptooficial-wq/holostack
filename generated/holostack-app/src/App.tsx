import React from 'react';
import Header from './components/Header';
import CarList from './components/CarList';
import { useCars } from './hooks/useCars';
import './App.css';

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