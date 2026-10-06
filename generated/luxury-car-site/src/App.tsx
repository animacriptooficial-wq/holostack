import React from 'react';
import Header from './components/Header';
import CarList from './components/CarList';
import useCarData from './hooks/useCarData';

const App: React.FC = () => {
  const { cars } = useCarData();

  return (
    <div style={styles.appContainer}>
      <Header />
      <CarList cars={cars} />
    </div>
  );
};

const styles = {
  appContainer: {
    backgroundColor: '#121212',
    minHeight: '100vh',
    padding: '20px',
  },
};

export default App;
