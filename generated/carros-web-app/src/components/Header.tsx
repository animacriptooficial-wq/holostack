import React from 'react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
        </ul>
      </nav>
    </header>
  );
};
