import { Order } from '../types';

export const fetchOrders = async (): Promise<Order[]> => {
  // Simulate fetching orders from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', item: 'Item 1', quantity: 2 },
        { id: '2', item: 'Item 2', quantity: 1 },
      ]);
    }, 1000);
  });
};

export const createOrder = async (order: Order): Promise<Order> => {
  // Simulate creating an order via an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...order, id: new Date().toISOString() });
    }, 1000);
  });
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  // Simulate deleting an order via an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
};

export const updateOrder = async (order: Order): Promise<Order> => {
  // Simulate updating an order via an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(order);
    }, 1000);
  });
};
