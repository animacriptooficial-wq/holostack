import React from 'react';
import CarList from './components/CarList';
import { useCars } from './hooks/useCars';

const App: React.FC = () => {
  const { cars, loading, error } = useCars();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading cars.</p>;

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Luxury Cars</h1>
      <CarList cars={cars} />
    </div>
  );
};

export default App;