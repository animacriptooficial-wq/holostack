import React from 'react';

const MainContent: React.FC = () => {
  return (
    <main style={styles.main}>
      <h2 style={styles.heading}>Welcome to My Next.js App</h2>
      <p style={styles.text}>This is a sample application using Next.js.</p>
    </main>
  );
};

const styles = {
  main: {
    padding: '20px',
    color: '#fff',
  },
  heading: {
    fontSize: '1.5em',
  },
  text: {
    fontSize: '1em',
  },
};

export default MainContent;
