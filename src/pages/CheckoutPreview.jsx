import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function CheckoutPreview() {

    const { user } = useAuth()
    const [pedidosPendientes, setPedidosPendientes] = useState([])
    const [loadingPedidos, setLoadingPedidos] = useState(false)
    // Total global
    const totalPendiente = pedidosPendientes.reduce((acc, o) => {
    return acc + Number(o.total || o.total_price || o.precio_total || 0)
    }, 0)



        // Función para cargar pedidos pendientes de pago
    async function loadPedidosPendientes() {
    setLoadingPedidos(true)
    try {
        let path = '/api/pedidos/cliente/mis-pedidos'
        //Valida usuario rol cliente con ruta correspondiente
        if (user && user.rol === 'cliente') {
        path = '/api/pedidos/cliente/mis-pedidos'
        }

        //Guarda la solicitud en res
        const res = await api.get(path)

        // Extrae los pedidos del response
        let arr = []
        if (res) {
        if (Array.isArray(res)) arr = res
        else if (res.pedidos && Array.isArray(res.pedidos)) arr = res.pedidos
        }
        //Obtener id del cliente
        const clientId = user && (user.id_usuario || user.id || user._id || user.id_cliente)

        const pendientes = arr.filter(o => {
        // Filtrar por cliente
        if (clientId) {
            const oid = o.id_cliente || o.cliente?.id_usuario || o.cliente?.id
            if (oid != null && String(oid) !== String(clientId)) return false
        }

        // Filtrar solo NO pagados
        const pagoValue = o.pagado || o.paid || o.is_paid || o.pago || ''
        const pagoStr = String(pagoValue).toLowerCase()
        const pagado = pagoValue === true || pagoStr === 'pagado' || pagoStr === 'paid' || pagoStr === 'si' || pagoStr === 'yes' || pagoStr === 'true'
        
        return !pagado // Solo los NO pagados
        })

        setPedidosPendientes(pendientes)

    } catch (e) {
        console.error('Error cargando pedidos pendientes:', e)
    } finally {
        setLoadingPedidos(false)
    }}

    useEffect(() => {
        loadPedidosPendientes()
        }, [user])

    function formatDate(dateStr) {
        if (!dateStr) return ''
        const ts = Date.parse(dateStr)
        if (Number.isNaN(ts)) return String(dateStr)
        try {
            return new Date(ts).toLocaleString('es-CO', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
            })
        } catch (e) {
            return new Date(ts).toISOString()
        }
    }
        
    // Botón de pagar todo
    async function handlePay() {
    try {
      if (!pedidosPendientes || pedidosPendientes.length === 0) {
        return toast.show("No hay pedidos pendientes por pagar", { type: "error" })
      }

      const pedidosIds = pedidosPendientes.map(p => p.id || p.id_pedido)

      const total = pedidosPendientes.reduce((acc, p) => acc + Number(p.total), 0)

      const res = await api.post(
        "/api/wompi/crear-transaccion",
        {
          id_pedido: pedidosIds[0], // por ahora solo 1 pedido por transacción
          total
        }
      )

      const url = res.checkoutUrl
      if (!url) throw new Error("No se recibió URL de pago")

      window.location.href = url

    } catch (e) {
      console.error("Error iniciando pago", e)
      toast.show("Error iniciando pago", { type: "error" })
    }
  }
    
    

    

  return (
    <div className="space-y-5 text-ink-900 pb-24"> {/* 👈 espacio para barra fija */}
        <h2 className="text-2xl font-semibold">Cuenta de pago</h2>

        <section className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="text-xl font-semibold mb-4">Pedidos pendientes</h3>

        {loadingPedidos ? (
            <div className="text-ink-500 text-center py-8">Cargando pedidos...</div>
        ) : pedidosPendientes.length === 0 ? (
            <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-ink-500">No tienes pedidos pendientes</p>
            </div>
        ) : (
            <div className="space-y-3">
            {pedidosPendientes.map(o => {
                const items = o.items || []
                const count = items.length
                const total = o.total || o.total_price || 0
                const pedidoId = o.id || o._id || o.id_pedido
                const status = String(o.estado || o.status || '').toLowerCase()
                const date = o.fecha || o.created_at || o.createdAt
                const formattedDate = formatDate(date)

                return (
                <div key={pedidoId} className="flex items-center gap-3 p-3 rounded-xl border bg-white border-gray-200">
                    
                    {/* Imagen */}
                    <div className="flex-shrink-0">
                    <img
                        src={items[0]?.product?.imagen_url || '/icons/burger.png'}
                        alt="Producto"
                        className="w-16 h-16 rounded-lg object-cover border bg-gray-100"
                    />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                    <div className="font-semibold text-ink-900">
                        Pedido #{pedidoId} · {count} producto{count !== 1 && 's'}
                    </div>

                    <div className="text-sm text-ink-700">
                        {items.slice(0, 2).map(it => it.nombre || it.product?.nombre).join(' + ')}
                        {items.length > 2 && ` +${items.length - 2} más`}
                    </div>

                    <div className="text-xs text-ink-500 mt-1">
                        {formattedDate}
                        {status && (
                        <>
                            {' · '}
                            <span className="inline-block text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </>
                        )}
                    </div>
                    </div>

                    {/* Precio */}
                    <div className="text-right flex-shrink-0 font-bold text-lg">
                    ${Number(total).toLocaleString('es-CO')}
                    </div>
                </div>
                )
            })}
            </div>
        )}
        </section>

        {/* 🔥 BARRA FIJA SIEMPRE */}
        {pedidosPendientes.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
            <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">

                {/* Total */}
                <div className="flex items-center gap-4">
                <div className="text-sm text-ink-600">
                    {pedidosPendientes.length} pedido{pedidosPendientes.length !== 1 && 's'} pendiente{pedidosPendientes.length !== 1 && 's'}
                </div>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="text-2xl font-bold text-ink-900">
                    ${totalPendiente.toLocaleString('es-CO')}
                </div>
                </div>

                {/* Botón de pago */}
                <button
                onClick={handlePay}
                className="
                    rounded-full
                    bg-brand-500
                    text-white
                    px-4 py-2
                    text-sm
                    font-semibold
                    hover:bg-brand-500/90
                    transition-colors
                "
                >
                Pagar ahora 💳
                </button>





            </div>
            </div>
        </div>
        )}
    </div>
    )

}
