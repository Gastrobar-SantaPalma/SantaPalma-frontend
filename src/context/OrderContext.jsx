import { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);

  const addOrder = (product) => {
    setOrders((prev) => [...prev, product]);
  };

  const confirmOrder = () => {
    if (orders.length === 0) return;

    const total = orders.reduce((sum, item) => sum + item.price, 0);
    setPendingAmount(total);
    setOrderStatus("por cobrar");
  };

  const clearOrders = () => {
    setOrders([]);
    setPendingAmount(0);
    setOrderStatus(null);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        confirmOrder,
        clearOrders,
        pendingAmount,
        orderStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrderContext);
}
