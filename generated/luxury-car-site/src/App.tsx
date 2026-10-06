import React from 'react';
import { useOrders } from './hooks/useOrders';
import Header from './components/Header';
import OrderList from './components/OrderList';

const App: React.FC = () => {
  const { orders } = useOrders();

  return (
    <div style={{ backgroundColor: '#222', color: '#fff', minHeight: '100vh' }}>
      <Header />
      <main style={{ padding: '20px' }}>
        <h2 style={{ color: '#fff' }}>Orders</h2>
        <OrderList orders={orders} />
      </main>
    </div>
  );
};

export default App;
