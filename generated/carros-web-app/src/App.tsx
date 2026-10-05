import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CarList } from './components/CarList';
import { CarDetails } from './components/CarDetails';
import { Header } from './components/Header';
import './styles.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <Routes>
          <Route path="/" element={<CarList />} />
          <Route path="/car/:id" element={<CarDetails />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
