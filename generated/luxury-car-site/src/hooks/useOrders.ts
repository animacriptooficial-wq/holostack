import { useEffect } from 'react';
import { useOrderStore } from '../store';
import { fetchOrders } from '../services/orderService';

export const useOrders = () => {
  const { orders, addOrder, removeOrder, updateOrder } = useOrderStore();

  useEffect(() => {
    const loadOrders = async () => {
      const fetchedOrders = await fetchOrders();
      fetchedOrders.forEach(order => addOrder(order));
    };

    loadOrders();
  }, [addOrder]);

  return { orders, addOrder, removeOrder, updateOrder };
};
