import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function CheckoutPreview() {

    const { user } = useAuth()
    const [pedidosPendientes, setPedidosPendientes] = useState([])
    const [loadingPedidos, setLoadingPedidos] = useState(false)
    const [selectedPedidos, setSelectedPedidos] = useState([])


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
        
    const togglePedidoSeleccion = (pedidoId) => {
        setSelectedPedidos(prev => {
            if (prev.includes(pedidoId)) {
            // Si ya está seleccionado, quitarlo
            return prev.filter(id => id !== pedidoId)
            } else {
            // Si no está seleccionado, agregarlo
            return [...prev, pedidoId]
            }
        })
    }
    // Función para calcular total
    const calcularTotalSeleccionado = () => {
        return pedidosPendientes
            .filter(o => selectedPedidos.includes(o.id || o._id || o.id_pedido))
            .reduce((acc, o) => acc + Number(o.total || o.total_price || o.precio_total || 0), 0)
    }

    const totalSeleccionado = calcularTotalSeleccionado()


  return (
    <div className="space-y-5 text-ink-900">
        <h2 className="text-2xl font-semibold">Carrito de pago</h2>

        {/* SECCIÓN DE PEDIDOS PENDIENTES */}
        <section className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="text-xl font-semibold mb-4">Pedidos pendientes de pago</h3>
        
            {loadingPedidos ? (
                <div className="text-ink-500 text-center py-8">
                    Cargando pedidos...
                </div>
            ) : pedidosPendientes.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-ink-500">No tienes pedidos pendientes de pago</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pedidosPendientes.map(o => {
                        const items = o.items || []
                        const count = items.length || o.total_items || 0
                        const title = items[0] ? (
                            items[0].product?.nombre || 
                            items[0].product?.name || 
                            items[0].nombre || 
                            items[0].name
                        ) : 'Pedido'
                        const total = o.total || o.total_price || o.precio_total || 0
                        const date = o.createdAt || o.fecha || o.created_at || ''
                        const formattedDate = date ? formatDate(date) : ''
                        const pedidoId = o.id || o._id || o.id_pedido
                        const isSelected = selectedPedidos.includes(pedidoId)

                        // Estado del pedido
                        const estado = String(o.estado || o.status || o.estado_pedido || o.state || '').toLowerCase()
                        const statusLabel = estado ? (estado.charAt(0).toUpperCase() + estado.slice(1)) : ''
                        const isDelivered = ['entregado','entregada','delivered','served','servido','completado','completed','finalizado','finalizada'].includes(estado)
                        const isCanceled = ['cancelado','cancelada','cancelled','canceled'].includes(estado)
                        const statusClass = isDelivered
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (isCanceled  
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-amber-100 text-amber-800')
                        return (
                            <div 
                                key={pedidoId}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        isSelected 
                                            ? 'border-brand-500 bg-brand-50' 
                                            : 'border-gray-200' 
                                    }`}
                                    
                            >
                                {/* Checkbox con click */}
                                <div 
                                className="flex-shrink-0 cursor-pointer"
                                onClick={() => togglePedidoSeleccion(pedidoId)}
                                >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected 
                                    ? 'border-brand-500 bg-brand-500' 
                                    : 'border-gray-300'
                                }`}>
                                    {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    )}
                                </div>
                                </div>

                                {/* Imagen del pedido */}
                                <div className="flex-shrink-0">
                                <img
                                    src={items[0]?.product?.imagen_url || items[0]?.product?.image || items[0]?.imagen_url || items[0]?.image || '/icons/burger.png'}
                                    alt={title}
                                    loading="lazy"
                                    onError={(e) => { 
                                    e.currentTarget.onerror = null; 
                                    e.currentTarget.src = '/icons/burger.png' 
                                    }}
                                    className="w-16 h-16 rounded-lg object-cover border bg-gray-100"
                                />
                                </div>

                                {/* Información del pedido */}
                                <div className="flex-1">
                                    <div className="font-semibold text-ink-900">
                                        Pedido #{pedidoId} · {count} Producto{count !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-sm text-ink-700">
                                        {items.slice(0, 2).map(it => (
                                            it.product?.nombre || it.nombre || it.name
                                        )).filter(Boolean).join(' + ')}
                                        {items.length > 2 && ` +${items.length - 2} más`}
                                    </div>
                                    <div className="text-xs text-ink-500 mt-1">
                                        {formattedDate}
                                        {statusLabel && (
                                            <>
                                                {' · '}
                                                <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                                                    {statusLabel}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Precio */}
                                <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-lg text-ink-900">
                                        ${Number(total).toLocaleString('es-CO')}
                                    </div>
                                </div>

                                {/* FRANJA FIJA CON TOTAL */}
                                {selectedPedidos.length > 0 && (
                                <div className="fixed bottom-8 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
                                    <div className="max-w-4xl mx-auto px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        {/* Info de selección */}
                                        <div className="flex items-center gap-4">
                                        <div className="text-sm text-ink-600">
                                            {selectedPedidos.length} pedido{selectedPedidos.length !== 1 ? 's' : ''} seleccionado{selectedPedidos.length !== 1 ? 's' : ''}
                                        </div>
                                        <div className="h-6 w-px bg-gray-300"></div>
                                        <div className="text-2xl font-bold text-ink-900">
                                            ${totalSeleccionado.toLocaleString('es-CO')}
                                        </div>
                                        </div>

                                        {/* Botón de pago */}
                                        <button
                                        onClick={() => {
                                            console.log('Procesando pago de pedidos:', selectedPedidos)
                                            console.log('Total:', totalSeleccionado)
                                        }}
                                        className="bg-brand-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-600 transition-colors shadow-md hover:shadow-lg"
                                        >
                                        Proceder al pago
                                        </button>
                                    </div>
                                    </div>
                                </div>
                                )}

                                {/* Espaciador para que el contenido no quede detrás de la franja */}
                                {selectedPedidos.length > 0 && (
                                <div className="h-20"></div>
                                )}

                            </div>)      
                    })}
                </div>
            )}
        </section>
    </div>
  )
}
