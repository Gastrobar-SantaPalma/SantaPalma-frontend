import { useNavigate } from 'react-router-dom'
import SemiProgress from "../components/SemiProgress.jsx";
import { useCart } from '../store/cart.jsx'
import { api } from '../api/client.js'
import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast.jsx'

export default function Orders() {
  const navigate = useNavigate()
  const { cart, removeItem, updateQuantity, clearCart, getTotal } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const toast = useToast()

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
      const payload = { items, total: getTotal() }
      const res = await api.post('/api/pedidos', payload)
      // success: clear cart and navigate to orders (could show order id if returned)
  clearCart()
  toast.show('Pedido creado con éxito', { type: 'success' })
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
        // accept multiple shapes: { orders: [...] } or array
        const arr = (res && res.orders) ? res.orders : (Array.isArray(res) ? res : (res && res.data ? res.data : []))
        if(mounted) setOrders(Array.isArray(arr) ? arr : [])
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

  return (
    <div className="space-y-5 text-ink-900">
      <h2 className="text-2xl font-semibold">Actividad reciente</h2>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-4">
          <SemiProgress value={73} />
          <div className="flex-1">
            <p className="text-sm text-ink-700">
              ¡Ya casi entregamos tu pedido!<br/>
              <span className="text-ink-500">Tiempo transcurrido: 12:06 minutos</span>
            </p>
            <button className="mt-3 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold">
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
                  <img src={img} className="w-12 h-12 rounded" />
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
        ) : orders && orders.length === 0 ? (
          <div className="text-ink-500">Aún no has hecho pedidos. Cuando confirmes un pedido aparecerá aquí.</div>
        ) : (
          orders.map(o=>{
            const items = o.items || o.detalle || []
            const count = items.length || o.total_items || 0
            const title = items[0] ? (items[0].product?.nombre || items[0].product?.name || items[0].nombre || items[0].name) : 'Pedido'
            const total = o.total || o.total_price || o.precio_total || 0
            const date = o.createdAt || o.fecha || o.created_at || ''
            return (
              <div key={o.id || o._id || o.numero} className="flex items-center gap-3 mb-3">
                <img src="/icons/drink.png" className="w-8 h-8" />
                <div className="flex-1">
                  <div className="font-semibold">{title} · {count} Productos <span className="text-ink-500">›</span></div>
                  <div className="text-sm text-ink-700">{items.slice(0,2).map(it=>(it.product?.nombre || it.nombre || it.name)).join(' + ')}</div>
                  <div className="text-xs text-ink-500">${Number(total).toLocaleString('es-CO')} {date ? '· ' + String(date) : ''}</div>
                </div>
                <button className="text-xs bg-brand-100 text-ink-900 px-3 py-1 rounded-full">Pedir de nuevo</button>
              </div>
            )
          })
        )}
        <div className="mt-2 text-xs text-ink-500">Completado</div>
      </section>

      <div className="h-10" />
    </div>
  );
}
