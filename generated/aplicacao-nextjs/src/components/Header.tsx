import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>My Next.js App</h1>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#333',
    padding: '10px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#fff',
    margin: 0,
  },
};

export default Header;
