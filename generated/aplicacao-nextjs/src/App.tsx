import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MainContent from './components/MainContent';

const App: React.FC = () => {
  return (
    <div style={styles.app}>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
};

const styles = {
  app: {
    backgroundColor: '#222',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
};

export default App;
