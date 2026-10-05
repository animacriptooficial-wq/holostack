import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>© 2023 My Next.js App</p>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#333',
    padding: '10px',
    textAlign: 'center' as const,
    position: 'fixed' as const,
    bottom: 0,
    width: '100%',
  },
  text: {
    color: '#fff',
    margin: 0,
  },
};

export default Footer;
