import create from 'zustand';
import { Order } from './types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (updatedOrder: Order) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  removeOrder: (orderId) => set((state) => ({ orders: state.orders.filter(order => order.id !== orderId) })),
  updateOrder: (updatedOrder) => set((state) => ({ orders: state.orders.map(order => order.id === updatedOrder.id ? updatedOrder : order) })),
}));
