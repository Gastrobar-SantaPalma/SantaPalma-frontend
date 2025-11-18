import React from "react"
import { useOrders } from "../context/OrderContext"


export default function PendingOrderCard() {
  const { orders } = useOrders()

  // encontrar el pedido más reciente que esté por cobrar
  const pendingOrder = [...orders].reverse().find(o => o.estado === "por_cobrar")

  if (!pendingOrder) return null // no se muestra nada si no hay pedidos

  const total = pendingOrder.total

  return (
    <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 shadow-md mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-yellow-900">
          Pedido pendiente por pagar
        </h3>

        <span className="bg-yellow-300 text-yellow-900 text-xs px-3 py-1 rounded-full font-semibold">
          POR COBRAR
        </span>
      </div>

      <p className="text-sm text-gray-700 mt-2">
        Tienes un pedido activo que aún no ha sido pagado.
      </p>

      <div className="mt-3 flex justify-between items-center">
        <span className="font-semibold text-gray-900 text-lg">
          Total: ${total.toLocaleString()}
        </span>

        <button className="bg-black text-white px-4 py-2 rounded-lg shadow">
          Pagar ahora
        </button>
      </div>
    </div>
  )
}
