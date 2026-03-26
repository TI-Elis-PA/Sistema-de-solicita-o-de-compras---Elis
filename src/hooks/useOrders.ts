import { useState, useEffect } from 'react';
import { Order, OrderStatus, AssinaturaDigital } from '../types';

const STORAGE_KEY = '@mini-sistema-compras:orders';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setOrders(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse orders from localStorage', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
  };

  const addOrder = (order: Order) => {
    const updatedOrders = [order, ...orders];
    saveOrders(updatedOrders);
  };

  const updateOrderStatus = (id: string, status: OrderStatus, observacao?: string, assinatura?: AssinaturaDigital) => {
    const updatedOrders = orders.map(order => 
      order.id === id ? { ...order, status, observacao: observacao || order.observacao, assinatura: assinatura || order.assinatura } : order
    );
    saveOrders(updatedOrders);
  };

  const updateOrder = (updatedOrder: Order) => {
    const updatedOrders = orders.map(order =>
      order.id === updatedOrder.id ? updatedOrder : order
    );
    saveOrders(updatedOrders);
  };

  const deleteOrder = (id: string) => {
    const updatedOrders = orders.filter(order => order.id !== id);
    saveOrders(updatedOrders);
  };

  const getOrderById = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const clearAllOrders = () => {
    saveOrders([]);
  };

  return {
    orders,
    isLoaded,
    addOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrderById,
    clearAllOrders,
  };
};
