import React from 'react';
import { Order } from '../types';

interface OrderListProps {
  orders: Order[];
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  return (
    <ul style={{ listStyleType: 'none', padding: 0 }}>
      {orders.map((order) => (
        <li key={order.id} style={{ padding: '10px', borderBottom: '1px solid #444' }}>
          <span style={{ color: '#fff' }}>Order #{order.id}: {order.description}</span>
        </li>
      ))}
    </ul>
  );
};

export default OrderList;
