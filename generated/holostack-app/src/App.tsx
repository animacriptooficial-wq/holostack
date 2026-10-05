import React from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
};

export default App;
