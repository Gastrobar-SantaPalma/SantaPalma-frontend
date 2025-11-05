import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import Account from "./pages/Account";
import PrivateRoute from "./components/PrivateRoute";
import TableLanding from "./pages/TableLanding";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  {/* QR landing route: /m/:venue/table/:tableId */}
  <Route path="/m/:venue/table/:tableId" element={<TableLanding />} />

      {/* Rutas con layout (TopBar + BottomNav) */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
  <Route path="/home" element={<Home />} />
  {/* /cart route was removed; map /cart to Orders (carrito manejado in Orders) */}
  <Route path="/cart" element={<Orders />} />
  <Route path="/orders" element={<Orders />} />
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
