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
import CheckoutPreview from "./pages/CheckoutPreview";
import SocialPage from "./pages/SocialPage";
import { useEffect } from "react";

export default function App() {

  useEffect(() => {
    const getLoggedUserId = () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const user = JSON.parse(raw);
        return user?.id_usuario ?? null;
      } catch {
        return null;
      }
    };

    const userId = getLoggedUserId();
    if (!userId) return;

    const sendHeartbeat = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        await fetch("http://localhost:4000/api/social/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, table_id: null })
        });
      } catch {}
    };

    sendHeartbeat();

    const intervalId = setInterval(sendHeartbeat, 60000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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
        <Route path="/social" element={<SocialPage />} />
        <Route path="/checkout" element={<CheckoutPreview />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}