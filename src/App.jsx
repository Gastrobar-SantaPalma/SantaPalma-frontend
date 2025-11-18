import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import PrivateRoute from "./components/PrivateRoute";
import ProductDetail from "./pages/ProductDetail"; // <<-- MANTENIDO de HEAD
import { OrderProvider } from "./context/OrderContext"; // <<-- MANTENIDO de HEAD
import TableLanding from "./pages/TableLanding"; // <<-- MANTENIDO de main

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* RUTA NUEVA DE MAIN (Para QR landing) */}
      <Route path="/m/:venue/table/:tableId" element={<TableLanding />} /> 

      <Route
        element={
          <PrivateRoute>
            <OrderProvider>
              <AppLayout />
            </OrderProvider>
          </PrivateRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Orders />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}