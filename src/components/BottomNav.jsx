import { NavLink } from "react-router-dom";
import { useCart } from "../store/cart";

const base = "flex-1 text-center py-2 text-sm relative";
const active = "text-brand-600 font-semibold border-t-2 border-brand-600";
const idle = "text-ink-500";

export default function BottomNav() {
  const { cart } = useCart();

  // Total de unidades en el carrito
  const totalQty = cart.items.reduce((acc, it) => acc + (it.cantidad || 0), 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-6px_20px_rgba(0,0,0,.06)] z-50">
      <div className="flex">

        {/* Inicio */}
        <NavLink
          to="/home"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          Inicio
        </NavLink>

        {/* Pedidos con badge */}
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `${base} ${isActive ? active : idle} ${
              totalQty > 0 ? "text-red-600 font-semibold" : ""
            }`
          }
        >
          <span>Pedidos</span>

          {/* Badge rojo, solo si hay items */}
          {totalQty > 0 && (
            <span
              className="absolute -top-1 right-3 bg-red-600 text-white text-[10px]
                         px-2 py-[2px] rounded-full font-bold shadow"
            >
              {totalQty}
            </span>
          )}
        </NavLink>

        {/* Cuenta */}
        <NavLink
          to="/account"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          Cuenta
        </NavLink>
      </div>
    </nav>
  );
}
