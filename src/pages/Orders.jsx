
import { useNavigate } from 'react-router-dom'
import SemiProgress from "../components/SemiProgress.jsx";
import { useCart } from '../store/cart.jsx'
import { useTable } from '../context/TableContext'
import { api } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext'

import { useEffect, useState } from "react";

export default function Orders(){
  const navigate = useNavigate()
  const toast = useToast()
  const { cart, removeItem, updateQuantity, clearCart, getTotal } = useCart()
  const { mesa } = useTable()
  const { user } = useAuth()

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
    // control modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false)


  const STORAGE_KEY = 'sp_active_order_ts'

  
  

  function readStoredTimestamps(){
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {} }catch(e){ return {} }
  }

  function saveStoredTimestamp(id, iso){
    try{
      const map = readStoredTimestamps()
      if(id){ map[String(id)] = iso; localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) }
    }catch(e){ /* ignore */ }
  }

  function removeStoredTimestamp(id){
    try{
      const map = readStoredTimestamps()
      if(id && map[String(id)]){ delete map[String(id)]; localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) }
    }catch(e){ /* ignore */ }
  }

  const [now, setNow] = useState(Date.now())

  // derive clientId for filtering orders and determine history (finalized) orders
  const clientId = user && (user.id_usuario || user.id || user._id || user.id_cliente) ? (user.id_usuario || user.id || user._id || user.id_cliente) : null
  const finalizedStatuses = new Set([
    'entregado','entregada','delivered','served','servido','completado','completed','finalizado','finalizada',
    'cancelado','cancelada','cancelled','canceled'
  ])

  const historial = Array.isArray(orders) ? orders.filter(o=>{
    
    
    // try to match by client id first
    if(clientId){
      const oid = o.id_cliente || o.cliente?.id_usuario || o.cliente?.id || o.user_id || o.id_usuario || o.cliente_id || o.customer_id || o.customer?.id
      if(oid != null) return String(oid) === String(clientId)
      // if oid not present, try matching by email
      const orderEmail = (o.correo || o.email || o.cliente?.correo || o.cliente?.email || '').toLowerCase()
      if(orderEmail && user && user.correo) return orderEmail === String(user.correo).toLowerCase()
      // if neither id nor email present, include the finalized order conservatively
      return true
    }
    // no client in session: show finalized orders (admin or public view)
    return true
  }) : []

  // Filtrar los pedidos para obtener solo los del día actual
  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const pedidosDelDia = Array.isArray(orders) ? orders.filter(o => {
    if(clientId){
      const oid = o.id_cliente || o.cliente?.id_usuario || o.cliente?.id || o.user_id || o.id_usuario || o.cliente_id
      if(oid != null && String(oid) !== String(clientId)) return false
    }
    const fechaPedido = o.fecha_pedido || o.fecha || o.createdAt || o.created_at
    if (!fechaPedido) return false
    const pedidoDate = new Date(fechaPedido)
    return pedidoDate >= hoyInicio
  }) : []

  // orders to show to the current user / mesa (includes active and finalized)
  const visibleOrders = Array.isArray(orders) ? orders.filter(o => {
    // prioritize matching by client id if we have a logged user
    if(clientId){
      const oid = o.id_cliente || o.cliente?.id_usuario || o.cliente?.id || o.user_id || o.id_usuario || o.cliente_id || o.customer_id || o.customer?.id
      if(oid != null) return String(oid) === String(clientId)
      const orderEmail = (o.correo || o.email || o.cliente?.correo || o.cliente?.email || '').toLowerCase()
      if(orderEmail && user && user.correo) return orderEmail === String(user.correo).toLowerCase()
      // if no id/email present, be conservative and include it
      return true
    }
    // if we're on a mesa flow, match by mesa id
    if(mesa && mesa.mesaId) return String(o.id_mesa) === String(mesa.mesaId)
    // otherwise show all
    return true
  }) : []

  

  const handleRemove = (id)=>{
    removeItem(id)
  }

  const handleChangeQty = (id, delta)=>{
    const item = cart.items.find(i=>i.id===id)
    if(!item) return
    const next = Math.max(1, (item.cantidad||0) + delta)
    updateQuantity(id, next)
  }

    // cuando el usuario confirma en el modal: cerramos el modal y ejecutamos la confirmación real
  function handleConfirmModal(){
    setShowConfirmModal(false)
    handleConfirm() // reutiliza tu función existente que envía el pedido
  }


  async function handleConfirm(){
  if(!cart.items || cart.items.length===0) return toast.show('El carrito está vacío', { type: 'error' })
    setSubmitting(true)
    try{
      // Build payload according to backend expected shape
      const items = cart.items.map(i=>({ id_producto: i.product.id || i.product.id_producto || i.product.idProduct, cantidad: i.cantidad }))
      const clienteId = user && (user.id_usuario || user.id || user._id || user.id_cliente) ? (user.id_usuario || user.id || user._id || user.id_cliente) : undefined
      const payload = {
        ...(mesa && mesa.mesaId ? { id_mesa: mesa.mesaId } : {}),
        ...(clienteId ? { id_cliente: clienteId } : {}),
        items
      }
      const res = await api.post('/api/pedidos', payload)
      console.log(payload);
      

      // success: clear cart and update orders immediately so the tracker updates
      clearCart()
      toast.show('Pedido creado con éxito', { type: 'success' })
      // if backend returned the created pedido object, prepend it to orders
      try{
        let created = res && (res.id_pedido || res.id || res._id) ? res : (res && res.pedido ? res.pedido : null)
        if(created){
          // ensure a timestamp exists so the timer can run immediately
          if(!created.createdAt && !created.fecha && !created.created_at){
            created = { ...created, createdAt: (new Date()).toISOString() }
          }
          setOrders(prev => Array.isArray(prev) ? [created, ...prev] : [created])
          // also open details modal for the newly created order (optional UX)
          setSelectedOrder(created)
          setShowDetails(true)
        } else {
          // fallback: reload list
          const r = await api.get('/api/pedidos')
          let arr = []
          if(r){
            if(Array.isArray(r)) arr = r
            else if(r.pedidos && Array.isArray(r.pedidos)) arr = r.pedidos
            else if(r.orders && Array.isArray(r.orders)) arr = r.orders
            else if(r.data && Array.isArray(r.data)) arr = r.data
          }
          setOrders(Array.isArray(arr) ? arr : [])
        }
      }catch(_){ /* ignore reload error */ }
      navigate('/orders')
    }catch(e){
      console.error('error creating order', e)
  const msg = e && e.message ? e.message : 'Error creando pedido'
  toast.show(msg, { type: 'error' })
    }finally{
      setSubmitting(false)
    }
    await loadOrders();
    

  }

  async function loadOrders(){
  setLoadingOrders(true)
  try{
    let res 
    
    const userId = user?.id || user?._id;

    // Construcción de la ruta dedicada
    let path = '/api/pedidos';

    // Si el usuario es un cliente, usamos la ruta dedicada
    if (user && user.rol === 'cliente') {
      path = '/api/pedidos/cliente/mis-pedidos' 
    }

    console.log('[loadOrders] Usando ruta:', path, 'para usuario:', user?.rol);

    // Realizamos la petición con la ruta determinada
    res = await api.get(path)

    console.log('[loadOrders] Respuesta recibida:', res);

    // accept multiple shapes
    let arr = []
    if(res){
      if(Array.isArray(res)) arr = res
      else if(res.pedidos && Array.isArray(res.pedidos)) arr = res.pedidos
      else if(res.orders && Array.isArray(res.orders)) arr = res.orders
      else if(res.data && Array.isArray(res.data)) arr = res.data
    }

    // merge stored timestamps
    try{
      const map = readStoredTimestamps()
      arr = Array.isArray(arr) ? arr.map(it=>{
        const id = it.id_pedido || it.id || it._id
        if((!it.createdAt && !it.fecha && !it.created_at) && id && map[String(id)]){
          return { ...it, createdAt: map[String(id)] }
        }
        return it
      }) : arr
    }catch(e){ /* ignore */ }

    setOrders(Array.isArray(arr) ? arr : [])

    // cleanup stored timestamps for finalized orders
    try{
      const finalSet = new Set(['entregado','entregada','delivered','served','servido','completado','completed','finalizado','finalizada','cancelado','cancelada','cancelled','canceled'])
      ;(Array.isArray(arr) ? arr : []).forEach(it=>{
        const st = String(it.estado || it.status || it.estado_pedido || it.state || '').toLowerCase()
        const id = it.id_pedido || it.id || it._id
        if(id && finalSet.has(st)) removeStoredTimestamp(id)
      })
    }catch(e){ /* ignore */ }
  }catch(e){
    console.error('failed to load orders', e)
    setOrdersError(e)
  }finally{
    setLoadingOrders(false)
  }
}
  useEffect(()=>{
    let mounted = true
    
    loadOrders()
    return ()=>{ mounted = false }
  }, [])

  // determine a representative order state to show in the tracker (most recent active order)
  const recentOrder = visibleOrders && visibleOrders.length > 0 ? visibleOrders[0] : (orders && orders.length > 0 ? orders[0] : null)
  const recentEstado = recentOrder ? (recentOrder.estado || recentOrder.status || recentOrder.estado_pedido || recentOrder.state) : undefined

  // clock tick to update elapsed timers used by the tracker and modal
  useEffect(()=>{
    const t = setInterval(()=> setNow(Date.now()), 1000)
    return ()=> clearInterval(t)
  }, [])

  

  function formatElapsed(createdAt){
    if(!createdAt) return '00:00'
    const ts = Date.parse(createdAt)
    if(Number.isNaN(ts)) return '00:00'
    const diff = Math.max(0, Math.floor((now - ts) / 1000))
    const hh = Math.floor(diff / 3600)
    const mm = Math.floor((diff % 3600) / 60)
    const ss = diff % 60
    if(hh>0) return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  }

  const recentElapsed = recentOrder ? formatElapsed(recentOrder.fecha || recentOrder.createdAt || recentOrder.created_at || recentOrder.fecha_pedido) : ''

  function formatDate(dateStr){
    if(!dateStr) return ''
    const ts = Date.parse(dateStr)
    if(Number.isNaN(ts)) return String(dateStr)
    try{
      return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }catch(e){
      return new Date(ts).toISOString()
    }
  }

  return (
    <div className="space-y-5 text-ink-900">
      <h2 className="text-2xl font-semibold">Actividad reciente</h2>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-4">
          <SemiProgress estado={recentEstado} />
          <div className="flex-1">
            <p className="text-sm text-ink-700">
              ¡Ya casi entregamos tu pedido!<br/>
              <span className="text-ink-500">Tiempo transcurrido: {recentOrder ? recentElapsed : '00:00'}</span>
            </p>
            {recentOrder && (
              <div className="mt-3 space-y-1">
                {(recentOrder.items || recentOrder.detalle || []).map((it, idx) => {
                  const prod = it.product || it
                  const name = prod.nombre || prod.name || it.nombre || it.name || 'Producto'
                  const qty = it.cantidad || it.qty || it.quantity || 1
                  return (
                    <div key={idx} className="text-sm text-ink-700 flex justify-between">
                      <span className="font-semibold">{name}</span>
                      <span className="font-semibold text-ink-500">x{qty}</span>

                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={()=>{ if(recentOrder) { setSelectedOrder(recentOrder); setShowDetails(true) } }} className="mt-3 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold">
              Detalles
            </button>
          </div>
        </div>
      </section>

            {/* Modal de confirmación inline */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl p-6 w-[92%] max-w-md text-center shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-bold mb-4">Confirmar pedido</h2>

            <p className="text-ink-700 mb-6">
              ¿Estás seguro? Una vez enviado, el pedido pasará a preparación y se cargará a tu cuenta
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-200 py-2 rounded-full font-semibold hover:bg-gray-300"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>

              <button
                className="flex-1 bg-brand-500 text-white py-2 rounded-full font-semibold hover:bg-brand-500/90"
                onClick={handleConfirmModal}
              >
                Confirmar pedido
              </button>
            </div>
          </div>
        </div>
      )}



      

      <h3 className="text-xl font-semibold mt-4">Pedidos</h3>
      {/* LISTADO DE PEDIDOS DEL DÍA */}
<section className="bg-white rounded-2xl p-4 shadow-card mt-4">
  <h4 className="font-semibold mb-3">Pedidos de hoy</h4>

  {pedidosDelDia.length === 0 && (
    <p className="text-sm text-ink-500">No tienes pedidos hoy.</p>
  )}

  {pedidosDelDia.map(order => (  // ← Ahora usa "pedidosDelDia"
    <div
      key={order.id_pedido || order.id || order._id}
      className="mb-3 pb-3 border-b last:border-none cursor-pointer"
      onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
    >
      <div className="flex justify-between">
        <div>
          <div className="font-semibold">Pedido #{order.id_pedido || order.id}</div>
          <div className="text-sm text-ink-500">
            {formatDate(order.fecha_pedido || order.createdAt || order.created_at || order.fecha)}
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold">
            ${Number(order.total).toLocaleString("es-CO")}
          </div>
          <span className={`text-sm px-2 py-1 rounded-full 
            ${(order.estado || order.status) === "preparando" || (order.estado || order.status) === "preparing" ? "bg-yellow-200 text-yellow-900" : ""}
            ${(order.estado || order.status) === "entregado" || (order.estado || order.status) === "delivered" ? "bg-green-200 text-green-900" : ""}
            ${(order.estado || order.status) === "pendiente" || (order.estado || order.status) === "created" ? "bg-gray-200 text-gray-800" : ""}
          `}>
            {order.estado || order.status}
          </span>
        </div>
      </div>
    </div>
  ))}
</section>

      <p className="text-xs text-ink-500 -mt-1">Solicitudes en curso</p>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        {(!cart || !cart.items || cart.items.length===0) ? (
          <div className="text-ink-500">No hay items en el carrito</div>
        ) : (
          <div className="space-y-3">
            {cart.items.map(it=>{
              const p = it.product
              const img = p.imagen_url || p.image || p.img || '/icons/burger.png'
              const title = p.nombre || p.name || 'Producto'
              const price = Number(p.precio ?? p.price ?? 0)
              return (
                
                <div key={it.id} className="flex items-center gap-3">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    onError={e=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/icons/burger.png' }}
                    className="w-20 h-20 rounded object-cover border bg-gray-100"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{title} <span className="text-ink-500">· {it.cantidad} </span></div>
                    <div className="text-sm text-ink-700 truncate">${(price * (it.cantidad||0)).toLocaleString('es-CO')}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={()=>handleChangeQty(it.id, -1)} className="px-2 py-1 rounded bg-brand-100">-</button>
                      <div className="px-3">{it.cantidad}</div>
                      <button onClick={()=>handleChangeQty(it.id, 1)} className="px-2 py-1 rounded bg-brand-100">+</button>
                      <button onClick={()=>handleRemove(it.id)} className="ml-4 text-xs bg-brand-100 text-ink-900 px-3 py-1 rounded-full">Eliminar</button>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-ink-700 font-semibold">Total</div>
              <div className="text-lg font-semibold">${getTotal().toLocaleString('es-CO')}</div>
            </div>

            <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={submitting}
                  className="flex-1 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold"
                >
                  {submitting ? 'Enviando...' : 'Confirmar pedido'}
                </button>

                <button onClick={() => clearCart()} className="rounded-full bg-brand-100 text-ink-900 px-5 py-2">Vaciar</button>
            </div>

          </div>
        )}
      </section>

      <h3 className="text-xl font-semibold mt-2">Historial</h3>
      <p className="text-xs text-ink-500 -mt-1">Sabores exquisitos en porciones justas</p>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        {loadingOrders ? (
          <div className="text-ink-500">Cargando historial...</div>
        ) : historial && historial.length === 0 ? (
          <div className="text-ink-500">Aún no has hecho pedidos. Cuando confirmes un pedido aparecerá aquí.</div>
        ) : (
          historial.map(o=>{
            const items = o.items || o.detalle || []
            const count = items.length || o.total_items || 0
            const title = items[0] ? (items[0].product?.nombre || items[0].product?.name || items[0].nombre || items[0].name) : 'Pedido'
            const total = o.total || o.total_price || o.precio_total || 0
            const date = o.createdAt || o.fecha || o.created_at || ''
            const formattedDate = date ? formatDate(date) : ''
            // historial: don't show thumbnails here, only key info
            const estado = String(o.estado || o.status || o.estado_pedido || o.state || '').toLowerCase()
            const statusLabel = estado ? (estado.charAt(0).toUpperCase() + estado.slice(1)) : ''
            const isDelivered = ['entregado','entregada','delivered','served','servido','completado','completed','finalizado','finalizada'].includes(estado)
            const isCanceled = ['cancelado','cancelada','cancelled','canceled'].includes(estado)
            const statusClass = isDelivered ? 'bg-emerald-100 text-emerald-800' : (isCanceled ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-ink-700')
            return (
              <div key={o.id || o._id || o.numero || o.id_pedido} className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <div className="font-semibold">{title} · {count} Productos <span className="text-ink-500">›</span></div>
                  <div className="text-sm text-ink-700">{items.slice(0,2).map(it=>(it.product?.nombre || it.nombre || it.name)).join(' + ')}</div>
                  <div className="text-xs text-ink-500">${Number(total).toLocaleString('es-CO')} {formattedDate ? '· ' + formattedDate : ''}</div>
                  {statusLabel ? (
                    <div className={`mt-2 inline-block text-xs px-2 py-1 rounded-full ${statusClass}`}>{statusLabel}</div>
                  ) : null}
                </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={()=>{ /* repetir pedido */ }} className="text-xs bg-brand-100 text-ink-900 px-3 py-1 rounded-full">Pedir de nuevo</button>
                        <button onClick={()=>{ setSelectedOrder(o); setShowDetails(true) }} className="text-xs border border-gray-200 text-ink-700 px-3 py-1 rounded-full">Detalles</button>
                      </div>
              </div>
            )
          })
  )}
      </section>

      

      <div className="h-10" />
      {/* Details modal */}
      {showDetails && selectedOrder ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[92%] md:w-2/3 max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalles del pedido #{selectedOrder.id_pedido || selectedOrder.id || selectedOrder._id || ''}</h3>
              <button onClick={()=>{ setShowDetails(false); setSelectedOrder(null) }} className="text-sm px-3 py-1 rounded bg-gray-100">Cerrar</button>
            </div>
            <div className="mb-4">
              <SemiProgress estado={selectedOrder.estado || selectedOrder.status || selectedOrder.estado_pedido || selectedOrder.state} />
              <div className="text-sm text-ink-500 mt-2">Tiempo transcurrido: {formatElapsed(selectedOrder.fecha || selectedOrder.createdAt || selectedOrder.created_at || selectedOrder.fecha_pedido)}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-ink-700">Mesa: {selectedOrder.id_mesa || selectedOrder.mesa || '—'}</div>
              <div className="text-sm text-ink-700">Fecha: {formatDate(selectedOrder.fecha || selectedOrder.createdAt || selectedOrder.created_at || selectedOrder.fecha_pedido)}</div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="space-y-2">
                {(selectedOrder.items || selectedOrder.detalle || []).map((it, idx)=>{
                  const prod = it.product || it
                  const name = prod.nombre || prod.name || it.nombre || it.name || 'Producto'
                  const qty = it.cantidad || it.qty || it.quantity || 1
                  const price = it.precio || it.price || prod.precio || prod.price || 0
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="text-sm">{name} <span className="text-ink-500">· {qty}</span></div>
                      <div className="text-sm">${Number(price * qty).toLocaleString('es-CO')}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-ink-700">Total</div>
              <div className="text-lg font-semibold">${Number(selectedOrder.total || selectedOrder.total_price || selectedOrder.precio_total || 0).toLocaleString('es-CO')}</div>
            </div>
            <div className="mt-6">
            <button
              className="w-full rounded-full bg-brand-500 text-white px-5 py-3 font-semibold text-center"
              onClick={() => {
                // Ir al checkout preview para pagar el pedido
                navigate("/checkout")
                console.log("Pagar pedido", selectedOrder);
              }}
            >
              Pagar
            </button>
          </div>

          </div>
        </div>
      ) : null}
    </div>
  );
  
}
