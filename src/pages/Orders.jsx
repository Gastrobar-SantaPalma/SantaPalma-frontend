
import { useNavigate } from 'react-router-dom'
import SemiProgress from "../components/SemiProgress.jsx";
import { useCart } from '../store/cart.jsx'
import { useTable } from '../context/TableContext'
import { api } from '../api/client.js'
import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext'

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
    const st = String(o.estado || o.status || o.estado_pedido || o.state || '').toLowerCase()
    if(!finalizedStatuses.has(st)) return false
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
  }

  useEffect(()=>{
    let mounted = true
    async function loadOrders(){
      setLoadingOrders(true)
      try{
        const res = await api.get('/api/pedidos')
        // accept multiple shapes: { pedidos: [...] } | { orders: [...] } | array | { data: [...] }
        let arr = []
        if(res){
          if(Array.isArray(res)) arr = res
          else if(res.pedidos && Array.isArray(res.pedidos)) arr = res.pedidos
          else if(res.orders && Array.isArray(res.orders)) arr = res.orders
          else if(res.data && Array.isArray(res.data)) arr = res.data
        }
        // merge stored timestamps for newly created orders so timers survive reloads
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
        if(mounted){
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
        }
      }catch(e){
        console.error('failed to load orders', e)
        if(mounted) setOrdersError(e)
      }finally{
        if(mounted) setLoadingOrders(false)
      }
    }
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
            <button onClick={()=>{ if(recentOrder) { setSelectedOrder(recentOrder); setShowDetails(true) } }} className="mt-3 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold">
              Detalles
            </button>
          </div>
        </div>
      </section>

      <h3 className="text-xl font-semibold mt-4">Pedidos</h3>
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
              <button onClick={handleConfirm} disabled={submitting} className="flex-1 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold">{submitting ? 'Enviando...' : 'Confirmar pedido'}</button>
              <button onClick={()=>clearCart()} className="rounded-full bg-brand-100 text-ink-900 px-5 py-2">Vaciar</button>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
