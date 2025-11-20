import React from "react"
import { useOrders } from "../context/OrderContext"
import { useNavigate } from "react-router-dom"


export default function PendingOrderCard() {
  const { orders } = useOrders()
  const navigate = useNavigate()

  // Encontrar el pedido más reciente que esté por cobrar
  const pendingOrder = [...orders].reverse().find(o => o.estado === "por_cobrar")

  if (!pendingOrder) return null // No se muestra nada si no hay pedidos en estado "por_cobrar"

  // --- DATOS CLAVE DEL PEDIDO PENDIENTE ---
  // Obtenemos el ID y los ítems directamente del pedido pendiente por cobrar
  const orderId = pendingOrder.id || pendingOrder.id_pedido || 'N/A' 
  const items = pendingOrder.items || [] // Lista de productos a mostrar
  const total = pendingOrder.total || 0
  
  const handlePaymentClick = () => {
    // Lógica para iniciar el proceso de pago.
    console.log(`Iniciando flujo de pago para Pedido #${orderId}`);
    // Aquí puedes añadir navigate(`/payment/${orderId}`); si tienes esa ruta
  };

  return (
    // Estilos de alerta para el estado "por_cobrar"
    <div className="bg-yellow-50 border-4 border-yellow-500 rounded-xl p-5 shadow-2xl mb-6">
      
      {/* 1. CABECERA: ID del Pedido y Etiqueta de Estado */}
      <div className="flex justify-between items-start border-b pb-3 mb-3">
        <h3 className="text-xl font-extrabold text-yellow-900 flex items-center">
          {/* Muestra el ID del pedido */}
          <span className="mr-2">#️⃣</span> Pedido #{orderId}
        </h3>

        <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-md">
          POR COBRAR
        </span>
      </div>

      <p className="text-sm text-gray-700 mt-2 mb-4 font-medium">
        Tu cuenta está lista. Aquí está el detalle para que puedas pagar:
      </p>

      {/* 2. DETALLE DE PRODUCTOS (Muestra lo que el cliente está pagando) */}
      {items.length > 0 ? (
        <div className="mt-2 p-3 bg-white rounded-lg max-h-40 overflow-y-auto border border-yellow-200 shadow-inner">
          <h4 className="text-sm font-bold text-yellow-800 mb-2 border-b pb-1">Productos y Precios:</h4>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm text-gray-700 border-b border-gray-100 last:border-b-0 py-1">
              <span className="truncate">
                <span className="font-extrabold">{item.quantity}x</span> {item.name}
              </span>
              {/* Formateo de moneda para el precio */}
              <span className="text-gray-500 font-semibold">${Number(item.price || 0).toLocaleString('es-CO')}</span> 
            </div>
          ))}
        </div>
      ) : (
          <p className="text-sm text-gray-500 italic p-3 bg-white rounded-lg">Detalle de productos no disponible.</p>
      )}

      {/* 3. TOTAL Y BOTÓN DE ACCIÓN */}
      <div className="mt-5 pt-4 border-t border-yellow-400 flex justify-between items-center">
        <span className="font-extrabold text-gray-900 text-3xl">
          Total: <span className="text-lg text-yellow-700">${Number(total).toLocaleString('es-CO')}</span>
        </span>

        <button 
          onClick={handlePaymentClick}
          className="font-bold px-6 py-2 rounded-full shadow-lg transition duration-300 bg-black text-white hover:bg-gray-800"
        >
          Pagar ahora
        </button>
      </div>
    </div>
  )
}