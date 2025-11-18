import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { TableProvider } from './context/TableContext'
import CartProvider from "./store/cart.jsx";
import { ToastProvider } from './components/Toast.jsx'
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <TableProvider>
      <CartProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CartProvider>
      </TableProvider>
    </AuthProvider>
  </BrowserRouter>
);
