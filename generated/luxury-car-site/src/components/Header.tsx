import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Luxury Car Showcase</h1>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#1a1a1a',
    padding: '10px 20px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
};

export default Header;
