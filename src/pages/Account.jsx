import { useEffect, useState, useRef } from 'react'
import { api, apiBlob } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast.jsx'

export default function Account(){
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editCorreo, setEditCorreo] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const toast = useToast()

  const { token, user: authUser, setUser: setAuthUser, logout } = useAuth()
  // admin-only product creation state
  const [categories, setCategories] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [prodNombre, setProdNombre] = useState('')
  const [prodDescripcion, setProdDescripcion] = useState('')
  const [prodPrecio, setProdPrecio] = useState('')
  const [prodCategoria, setProdCategoria] = useState('')
  const [prodDisponible, setProdDisponible] = useState(true)
  const [prodImageUrl, setProdImageUrl] = useState('')
  // admin: product management (list / edit / delete)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [editProductOpen, setEditProductOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editProdNombre, setEditProdNombre] = useState('')
  const [editProdDescripcion, setEditProdDescripcion] = useState('')
  const [editProdPrecio, setEditProdPrecio] = useState('')
  const [editProdCategoria, setEditProdCategoria] = useState('')
  const [editProdDisponible, setEditProdDisponible] = useState(true)
  const [editProdImageUrl, setEditProdImageUrl] = useState('')
  const [productActionLoading, setProductActionLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [createNameError, setCreateNameError] = useState('')
  const [editNameError, setEditNameError] = useState('')
  const [productsOpen, setProductsOpen] = useState(false)
  // QR generation state (admin)
  // keep the input as a string so the user can clear/edit freely, and parse to number only when needed
  const [qrMesaInput, setQrMesaInput] = useState('1')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrUrl, setQrUrl] = useState(null)
  // mesa creation state (admin)
  const [newMesaId, setNewMesaId] = useState('')
  const [newMesaEstado, setNewMesaEstado] = useState('libre')
  const [newMesaUbicacion, setNewMesaUbicacion] = useState('')
  const [creatingMesa, setCreatingMesa] = useState(false)
  // categories management state (admin)
  const [categoriesOpenPanel, setCategoriesOpenPanel] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [createCategoryName, setCreateCategoryName] = useState('')
  const [createCategoryDescripcion, setCreateCategoryDescripcion] = useState('')
  const [createCategoryActivo, setCreateCategoryActivo] = useState(true)
  const [createCategoryError, setCreateCategoryError] = useState('')
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryDescripcion, setEditCategoryDescripcion] = useState('')
  const [editCategoryActivo, setEditCategoryActivo] = useState(true)
  const [categoryActionLoading, setCategoryActionLoading] = useState(false)
  const [loadingCategoriesList, setLoadingCategoriesList] = useState(false)
  // active orders management (admin/staff)
  const [ordersActive, setOrdersActive] = useState([])
  const [loadingActiveOrders, setLoadingActiveOrders] = useState(false)
  const [ordersOpenPanel, setOrdersOpenPanel] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [orderActionLoading, setOrderActionLoading] = useState(false)
  const [viewOrderEstado, setViewOrderEstado] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('pendiente')
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersLimit, setOrdersLimit] = useState(20)
  const [ordersTotalPages, setOrdersTotalPages] = useState(1)
  // caches to avoid refetching products/clients repeatedly
  const productCacheRef = useRef({})
  const clientCacheRef = useRef({})
  // simple state to force rerender when product cache is populated asynchronously
  const [productLookupVersion, setProductLookupVersion] = useState(0)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
  try{
        // If we already have a user in the auth context (login/signup provided it), use it.
        if(authUser){
          if(mounted) { setUser(authUser); return }
        }

        // Only attempt to fetch /me when we have a token (prevent cookie-based anonymous sessions)
        if(!token){
          if(mounted) setUser(null)
          return
        }

        // fetch user profile using token; avoid sending cookies
        let res = null
        try{
          res = await api.get('/api/usuarios/me', { credentials: 'omit' })
        }catch(err){
          // if the endpoint is not found, try a common alternative under /api/auth/me
          if(err && err.status === 404){
            try{ res = await api.get('/api/auth/me', { credentials: 'omit' }) }catch(err2){ throw err }
          }else{
            throw err
          }
        }

        // Normalize response shapes: accept { user } | { usuario } | { data: { user } } | direct user object
        const normalized = res && (res.user || res.usuario || (res.data && (res.data.user || res.data.usuario)) || res)
        if(mounted){ setUser(normalized); try{ setAuthUser(normalized); localStorage.setItem('user', JSON.stringify(normalized)) }catch(_){ } }
      }catch(e){
        // If /me fails, do NOT fall back to listing all users (that may return another user's record).
        // Instead surface the error and handle auth issues (401) by forcing re-login.
        console.warn('failed to load user via /me', e)
        if(mounted){
          setUser(null)
          setError(e)
          // if token invalid/expired, force logout and redirect to login
          if(e && e.status === 401){
            toast.show('Sesión expirada. Por favor inicia sesión de nuevo.', { type: 'error' })
            try{ logout() }catch(_){ /* ignore */ }
            try{ navigate('/login') }catch(_){ /* ignore */ }
          }
        }
      }finally{
        if(mounted) setLoading(false)
      }
    }
    load()
    return ()=>{ mounted = false }
  }, [token])

  // load categories for admin product creation (only when admin opens modal or on mount if admin)
  useEffect(()=>{
    let mounted = true
    async function loadCats(){
      if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin'))) return
      try{
        const res = await api.get('/api/categorias')
        const arr = Array.isArray(res) ? res : (res && res.items ? res.items : [])
        if(mounted) setCategories(arr)
      }catch(err){
        console.warn('failed to load categories for product creation', err)
      }
    }
    loadCats()
    return ()=>{ mounted = false }
  }, [authUser])

  // load products for admin management
  const loadProducts = async () => {
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin'))) return
    setLoadingProducts(true)
    try{
      // request a larger limit for management view
      const res = await api.get('/api/productos?limit=200')
      const arr = res && (res.products || res.items) ? (res.products || res.items) : (Array.isArray(res) ? res : [])
      setProducts(arr)
    }catch(err){
      console.warn('failed to load products for admin', err)
      setProducts([])
    }finally{
      setLoadingProducts(false)
    }
  }

  useEffect(()=>{
    let mounted = true
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin' || authUser.rol === 'staff' || authUser.role === 'staff' || authUser.rol === 'empleado' || authUser.role === 'empleado'))) return
    // load on mount when admin/staff
    loadProducts()
    // also load active orders for staff/admin management
    try{ loadActiveOrders() }catch(_){ }
    return ()=>{ mounted = false }
  }, [authUser])

  // reload orders when filters/pagination change
  useEffect(()=>{
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin' || authUser.rol === 'staff' || authUser.role === 'staff' || authUser.rol === 'empleado' || authUser.role === 'empleado'))) return
    // call loader when filter/page/limit change
    try{ loadActiveOrders() }catch(_){ }
  }, [estadoFilter, ordersPage, ordersLimit, authUser])

  // helper to reload categories list (used after create/edit/delete)
  const loadCategories = async () => {
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin'))) return
    setLoadingCategoriesList(true)
    try{
      const res = await api.get('/api/categorias')
      const arr = Array.isArray(res) ? res : (res && res.items ? res.items : [])
      setCategories(arr)
    }catch(err){
      console.warn('failed to load categories', err)
      setCategories([])
    }finally{
      setLoadingCategoriesList(false)
    }
  }

  // load active orders for management (staff/admin)
  const loadActiveOrders = async () => {
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin' || authUser.rol === 'staff' || authUser.role === 'staff' || authUser.rol === 'empleado' || authUser.role === 'empleado'))) return
    setLoadingActiveOrders(true)
    try{
      // build query params from current filters (estado, page, limit)
      const qs = new URLSearchParams()
      if(estadoFilter) qs.set('estado', estadoFilter)
      if(ordersPage) qs.set('page', String(ordersPage))
      if(ordersLimit) qs.set('limit', String(ordersLimit))
      const url = '/api/pedidos' + (qs.toString() ? ('?' + qs.toString()) : '')
      const res = await api.get(url)
      // backend returns paginated shape: { page, limit, total, totalPages, pedidos: [...] }
      const arr = res && (res.pedidos || res.items) ? (res.pedidos || res.items) : (Array.isArray(res) ? res : (res && res.data ? res.data : []))
      // Enrich orders: attach cliente object and product info to each item when only ids are present in DB
      const productCache = productCacheRef.current || {}
      const clientCache = clientCacheRef.current || {}

      // Enrich clients (one-by-one, cached)
      const ordersArray = Array.isArray(arr) ? arr : []
      for (const o of ordersArray) {
        try{
          const idCliente = o.id_cliente || o.idCliente || o.id_cliente_usuario || o.id_cliente_usuario
          if (idCliente) {
            if (!clientCache[idCliente]){
              try{ clientCache[idCliente] = await api.get(`/api/usuarios/${idCliente}`) }catch(_){ clientCache[idCliente] = null }
            }
            if (clientCache[idCliente]) o.cliente = clientCache[idCliente]
          }
        }catch(e){ /* ignore client enrichment errors */ }
      }

      // Try to batch fetch products by ids to avoid many single requests (and 404 spam)
      try{
        // collect unique product ids from all orders
        const pidSet = new Set()
        for(const o of ordersArray){
          const itemsArr = o.items || o.detalle || []
          for(const it of itemsArr){
            const pid = it.id_producto || it.idProducto || it.id_prod || it.id_producto_fk || it.id_producto
            if(pid) pidSet.add(String(pid))
          }
        }
        const pids = Array.from(pidSet)
        if(pids.length > 0){
          // Attempt batch endpoint: /api/productos?ids=1,2,3
          const batchRes = await api.get(`/api/productos?ids=${pids.join(',')}`)
          const productsArr = Array.isArray(batchRes) ? batchRes : (batchRes && (batchRes.items || batchRes.products) ? (batchRes.items || batchRes.products) : null)
          if(Array.isArray(productsArr)){
            // map by id (support different id keys)
            const mapById = {}
            for(const prod of productsArr){
              const pid = prod.id || prod.id_producto || prod.idProduct || prod.id_producto || prod.idProducto
              if(pid) mapById[String(pid)] = prod
            }
            // populate product cache for faster lookup later
            for(const k of Object.keys(mapById)){
              try{ productCacheRef.current[String(k)] = mapById[k] }catch(_){ /* ignore */ }
            }
            // attach product info to items
            for(const o of ordersArray){
              const itemsArr = o.items || o.detalle || []
              for(const it of itemsArr){
                const pid = it.id_producto || it.idProducto || it.id_prod || it.id_producto_fk || it.id_producto
                if(pid && mapById[String(pid)]) it.product = mapById[String(pid)]
              }
            }
          } else {
            // batch endpoint not available or returned unexpected shape — perform a bounded per-id fallback
            // Collect missing product ids (where item has no product/name) and fetch them individually (but capped)
            const missing = []
            for(const o of ordersArray){
              const itemsArr = o.items || o.detalle || []
              for(const it of itemsArr){
                const pid = it.id_producto || it.idProducto || it.id_prod || it.id_producto_fk || it.id_producto
                const hasName = it.product?.nombre || it.producto?.nombre || it.nombre || it.name || it.producto_nombre || it.nombre_producto
                if(pid && !hasName && !(productCacheRef.current && productCacheRef.current[String(pid)])){
                  missing.push(String(pid))
                }
              }
            }
            // unique and capped to avoid flooding the backend
            const uniqueMissing = Array.from(new Set(missing)).slice(0, 30)
            if(uniqueMissing.length > 0){
              try{
                const promises = uniqueMissing.map(pid => api.get(`/api/productos/${pid}`).then(res=>({ pid, res })).catch(err=>({ pid, res: null })))
                const results = await Promise.all(promises)
                for(const r of results){
                  // normalize different backend shapes into a product object
                  const raw = r.res
                  const prodObj = raw && (raw.producto || raw.product || (raw.data && (raw.data.producto || raw.data.product)) || (Array.isArray(raw) && raw[0])) || raw || null
                  productCacheRef.current[String(r.pid)] = prodObj
                }
                // attach found products to items
                for(const o of ordersArray){
                  const itemsArr = o.items || o.detalle || []
                  for(const it of itemsArr){
                    const pid = it.id_producto || it.idProducto || it.id_prod || it.id_producto_fk || it.id_producto
                    if(pid && productCacheRef.current[String(pid)]) it.product = productCacheRef.current[String(pid)]
                  }
                }
                // trigger rerender so UI picks up attached names
                setProductLookupVersion(v=>v+1)
              }catch(e){
                console.warn('per-id product enrichment failed', e)
              }
            }
          }
        }
      }catch(e){
        console.warn('batch product enrichment failed, skipping per-id requests to avoid 404 spam', e)
      }

      const enriched = ordersArray
      // persist caches
      productCacheRef.current = productCache
      clientCacheRef.current = clientCache
      // set pagination info when available
      try{
        const page = Number(res.page || res.page === 0 ? res.page : ordersPage)
        const limit = Number(res.limit || ordersLimit)
        const totalPages = Number(res.totalPages || res.total_pages || Math.max(1, Math.ceil((res.total||0)/limit)))
        setOrdersPage(page || ordersPage)
        setOrdersLimit(limit || ordersLimit)
        setOrdersTotalPages(totalPages || 1)
      }catch(_){ /* ignore */ }
      // Only include orders that are explicitly 'pendiente' (or empty) when estadoFilter is 'pendiente'
  const normalized = Array.isArray(enriched) ? enriched : []
      const filtered = normalized.filter(o=>{
        const estado = String(o.estado || o.status || o.estado_pedido || '').toLowerCase()
        if(!estadoFilter) return true
        if(estadoFilter === 'pendiente') return estado === '' || /pend/.test(estado)
        return estado.includes(String(estadoFilter).toLowerCase())
      })
      setOrdersActive(filtered)
    }catch(err){
      console.warn('failed to load active orders', err)
      setOrdersActive([])
    }finally{
      setLoadingActiveOrders(false)
    }
  }

  function openConfirm(){ setConfirmOpen(true) }
  function closeConfirm(){ setConfirmOpen(false) }

  function openCreateCategory(){ setCreateCategoryName(''); setCreateCategoryError(''); setCreateCategoryOpen(true) }
  function closeCreateCategory(){ setCreateCategoryOpen(false) }

  async function handleCreateCategory(e){
    e && e.preventDefault && e.preventDefault()
    setCreatingCategory(true)
    try{
      const payload = { nombre: (createCategoryName || '').toString().trim() }
      if(!payload.nombre){ setCreateCategoryError('El nombre es obligatorio'); return }
      if(createCategoryDescripcion) payload.descripcion = createCategoryDescripcion
      payload.activo = Boolean(createCategoryActivo)

      // client-side duplicate check
      const nameNorm = payload.nombre.toLowerCase()
      const dup = categories.find(c=> ((c.nombre||c.name||'').toString().trim().toLowerCase()) === nameNorm)
      if(dup){ setCreateCategoryError('Ya existe una categoría con ese nombre'); return }

      await api.post('/api/categorias', payload)
      toast.show('Categoría creada', { type: 'success' })
      setCreateCategoryOpen(false)
      try{ await loadCategories() }catch(_){ }
    }catch(err){
      console.error('failed to create category', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      setCreateCategoryError(serverMsg || 'Error creando categoría')
    }finally{
      setCreatingCategory(false)
    }
  }

  function openEditCategory(cat){
    setEditingCategory(cat)
    setEditCategoryName(cat.nombre || cat.name || '')
    setEditCategoryDescripcion(cat.descripcion || cat.description || '')
    setEditCategoryActivo(cat.activo === undefined ? true : Boolean(cat.activo))
    setEditCategoryOpen(true)
  }
  function closeEditCategory(){ setEditingCategory(null); setEditCategoryOpen(false) }

  async function handleEditCategorySubmit(e){
    e && e.preventDefault && e.preventDefault()
    if(!editingCategory) return
    const id = editingCategory.id || editingCategory.id_categoria || editingCategory.idCategoria
    if(!id){ toast.show('No se pudo determinar el id de la categoría', { type: 'error' }); return }
    setCategoryActionLoading(true)
    try{
      const nameNorm = (editCategoryName || '').toString().trim().toLowerCase()
      if(nameNorm){
        const dup = categories.find(c=>{
          const cid = c.id || c.id_categoria
          const cName = (c.nombre||c.name||'').toString().trim().toLowerCase()
          return cName === nameNorm && String(cid) !== String(id)
        })
        if(dup){ toast.show('Ya existe una categoría con ese nombre', { type: 'error' }); return }
      }
  const payload = { nombre: editCategoryName }
  if(editCategoryDescripcion) payload.descripcion = editCategoryDescripcion
  payload.activo = Boolean(editCategoryActivo)
      await api.put(`/api/categorias/${id}`, payload)
      toast.show('Categoría actualizada', { type: 'success' })
      closeEditCategory()
      try{ await loadCategories() }catch(_){ }
    }catch(err){
      console.error('failed to update category', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      toast.show(serverMsg || 'Error actualizando categoría', { type: 'error' })
    }finally{
      setCategoryActionLoading(false)
    }
  }

  async function handleDeleteCategory(cat){
    if(!cat) return
    const id = cat.id || cat.id_categoria || cat.idCategoria
    if(!id) return
    const ok = window.confirm('¿Eliminar categoría? Esta acción es irreversible.')
    if(!ok) return
    setCategoryActionLoading(true)
    try{
      await api.del(`/api/categorias/${id}`)
      toast.show('Categoría eliminada', { type: 'success' })
      try{ await loadCategories() }catch(_){ }
    }catch(err){
      console.error('failed to delete category', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      toast.show(serverMsg || 'Error eliminando categoría', { type: 'error' })
    }finally{
      setCategoryActionLoading(false)
    }
  }

  // order actions
  function openViewOrder(o){ setViewingOrder(o); setViewOrderEstado((o && (o.estado || o.status)) ? String(o.estado || o.status).toLowerCase() : 'pendiente'); setViewOrderOpen(true) }
  function closeViewOrder(){ setViewingOrder(null); setViewOrderOpen(false) }

  async function updateOrderStatus(id, nextStatus){
    if(!id) return
    setOrderActionLoading(true)
    try{
      // Normalize and validate estado before sending
      const map = {
        pendiente: 'pendiente',
        preparacion: 'preparando',
        'preparación': 'preparando',
        preparando: 'preparando',
        listo: 'listo',
        entregado: 'entregado',
        cancelado: 'cancelado'
      }
      const allowed = ['pendiente','preparando','listo','entregado','cancelado']
      const raw = (nextStatus || '').toString().toLowerCase().trim()
      const target = map[raw] || null
      if(!target || !allowed.includes(target)){
        toast.show('Estado no v\u00e1lido o no soportado: ' + String(nextStatus), { type: 'error' })
        setOrderActionLoading(false)
        return
      }

      // try PATCH first (backend expects PATCH /api/pedidos/:id/estado with JSON { estado })
      try{
        await api.patch(`/api/pedidos/${id}/estado`, { estado: target })
      }catch(patchErr){
        // If PATCH fails (CORS preflight, 405, network error), try PUT as a fallback
        console.warn('PATCH failed, trying PUT fallback for order status update', patchErr)
        try{
          await api.put(`/api/pedidos/${id}/estado`, { estado: target })
        }catch(putErr){
          // rethrow original patch error if put also fails to preserve server message when available
          throw patchErr || putErr
        }
      }
      toast.show('Estado actualizado', { type: 'success' })
      try{ await loadActiveOrders() }catch(_){ }
      closeViewOrder()
    }catch(err){
      console.error('failed to update order status', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      toast.show(serverMsg || 'Error actualizando pedido', { type: 'error' })
    }finally{
      setOrderActionLoading(false)
    }
  }

  function openEdit(){
    if(!user) return
    setEditNombre(user.nombre || user.name || '')
    setEditCorreo(user.correo || user.email || '')
    setEditOpen(true)
  }
  function closeEdit(){ setEditOpen(false) }

  function openPwd(){
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwdOpen(true)
  }
  function closePwd(){ setPwdOpen(false) }

  async function handleDelete(){
    if(!user) return
    setDeleting(true)
    try{
      const id = user.id || user.id_usuario || user._id || user.idUser
      if(!id) throw new Error('No se pudo determinar el id de usuario')
      await api.del(`/api/usuarios/${id}`)
      // clear session and go to landing
      logout()
      navigate('/')
    }catch(e){
      console.error('failed to delete account', e)
      alert((e && e.message) || 'Error eliminando la cuenta')
    }finally{
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  function _getUserId(u){
    return u && (u.id || u.id_usuario || u._id || u.idUser)
  }

  function _getOrderId(o){
    if(!o) return null
    return o.id || o._id || o.numero || o.id_pedido || o.idPedido || o.idPedido || o.id_pedido || null
  }

  function openCreate(){
    setProdNombre('')
    setProdDescripcion('')
    setProdPrecio('')
    setProdCategoria(categories && categories.length>0 ? (categories[0].id_categoria || categories[0].id) : '')
    setProdDisponible(true)
    setProdImageUrl('')
    setCreateNameError('')
    setCreateOpen(true)
  }
  function closeCreate(){ setCreateOpen(false) }

  async function handleCreateProduct(e){
    e.preventDefault()
    setCreating(true)
    try{
      // send JSON payload (backend expects fields in body for create)
      const payload = {
        nombre: prodNombre,
        descripcion: prodDescripcion,
        precio: prodPrecio ? Number(prodPrecio) : 0,
        disponible: Boolean(prodDisponible),
      }
      if(prodCategoria) payload.id_categoria = prodCategoria
      if(prodImageUrl) payload.imagen_url = prodImageUrl

      try{
        // client-side duplicate name check to avoid server 'already exists' error
        const nameNorm = (payload.nombre || '').toString().trim().toLowerCase()
        if(nameNorm){
          const dup = products.find(p=> ((p.nombre||p.name||'').toString().trim().toLowerCase()) === nameNorm)
          if(dup){
            setCreateNameError('Ya existe un producto con ese nombre')
            return
          }
        }

        const res = await api.post('/api/productos', payload)
        toast.show('Producto creado', { type: 'success' })
        setCreateOpen(false)
        try{ await loadProducts() }catch(_){ /* ignore */ }
      }catch(err){
        console.error('failed to create product', err)
        const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
        if(String(serverMsg || '').toLowerCase().includes('existe')){
          setCreateNameError(String(serverMsg))
        }else{
          toast.show(serverMsg || 'Error creando producto', { type: 'error' })
        }
      }
    }catch(err){
      // Log richer error details (status and parsed body) to help debug 500s
      console.error('failed to create product', err, 'status=', err && err.status, 'data=', err && err.data)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      toast.show(serverMsg || 'Error creando producto', { type: 'error' })
    }finally{
      setCreating(false)
    }
  }

  // Admin: open edit modal for a product
  function openEditProduct(p){
    setEditingProduct(p)
    setEditProdNombre(p.nombre || p.name || '')
    setEditProdDescripcion(p.descripcion || p.description || '')
    setEditProdPrecio(p.precio || p.price || '')
    setEditProdCategoria(p.id_categoria || p.idCategoria || '')
    setEditProdDisponible(p.disponible === undefined ? true : Boolean(p.disponible))
    setEditProdImageUrl(p.imagen_url || p.image || '')
    setEditProductOpen(true)
  }
  function closeEditProduct(){
    setEditProductOpen(false)
    setEditingProduct(null)
  }

  async function handleEditProductSubmit(e){
    e.preventDefault()
    if(!editingProduct) return
    const id = editingProduct.id || editingProduct.id_producto || editingProduct.idProduct
    if(!id){ toast.show('No se pudo determinar el id del producto', { type: 'error' }); return }
    setProductActionLoading(true)
    try{
      // client-side duplicate name check: if another product (different id) has the same name, abort
      const nameNorm = (editProdNombre || '').toString().trim().toLowerCase()
      if(nameNorm){
        const dup = products.find(p=>{
          const pid = p.id || p.id_producto || p.idProduct
          const pName = (p.nombre||p.name||'').toString().trim().toLowerCase()
          return pName === nameNorm && String(pid) !== String(id)
        })
        if(dup){
          setEditNameError('Ya existe un producto con ese nombre')
          return
        }
      }
      // send JSON payload for update (backend should treat this as update)
      const payload = {
        nombre: editProdNombre,
        descripcion: editProdDescripcion,
        precio: editProdPrecio ? Number(editProdPrecio) : 0,
        disponible: Boolean(editProdDisponible),
      }
      if(editProdCategoria) payload.id_categoria = editProdCategoria
      if(editProdImageUrl) payload.imagen_url = editProdImageUrl

      await api.put(`/api/productos/${id}`, payload)
      toast.show('Producto actualizado', { type: 'success' })
      closeEditProduct()
      try{ await loadProducts() }catch(_){ }
    }catch(err){
      console.error('failed to update product', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      if(String(serverMsg || '').toLowerCase().includes('existe')){
        setEditNameError(String(serverMsg))
      }else{
        toast.show(serverMsg || 'Error actualizando producto', { type: 'error' })
      }
    }finally{
      setProductActionLoading(false)
    }
  }

  async function handleDeleteProduct(id){
    if(!id) return
    const ok = window.confirm('¿Eliminar producto? Esta acción es irreversible.')
    if(!ok) return
    setProductActionLoading(true)
    try{
      await api.del(`/api/productos/${id}`)
      toast.show('Producto eliminado', { type: 'success' })
      try{ await loadProducts() }catch(_){ }
    }catch(err){
      console.error('failed to delete product', err)
      const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
      toast.show(serverMsg || 'Error eliminando producto', { type: 'error' })
    }finally{
      setProductActionLoading(false)
    }
  }

  async function handleEditSubmit(e){
    e.preventDefault()
    if(!user) return
    const id = _getUserId(user)
  if(!id){ toast.show('No se pudo determinar el id de usuario', { type: 'error' }); return }
    setEditLoading(true)
    try{
      const payload = { nombre: editNombre, correo: editCorreo }
      const res = await api.put(`/api/usuarios/${id}`, payload)
      // try several response shapes
      const updated = res && (res.user || res.data || res) || payload
      setUser(prev => ({ ...(prev||{}), ...updated }))
  toast.show('Perfil actualizado', { type: 'success' })
      setEditOpen(false)
    }catch(err){
      console.error('failed to update profile', err)
  toast.show((err && err.message) || 'Error actualizando perfil', { type: 'error' })
    }finally{
      setEditLoading(false)
    }
  }

  async function handleChangePassword(e){
    e.preventDefault()
    if(!user) return
    const id = _getUserId(user)
  if(!id){ toast.show('No se pudo determinar el id de usuario', { type: 'error' }); return }
  if(!newPassword || newPassword.length < 6){ toast.show('La nueva contraseña debe tener al menos 6 caracteres', { type: 'error' }); return }
  if(newPassword !== confirmPassword){ toast.show('Las contraseñas no coinciden', { type: 'error' }); return }
    setPwdLoading(true)
    try{
      // best-effort: send currentPassword and new password in field contrasena
      const payload = { contrasena: newPassword, currentPassword }
      const res = await api.put(`/api/usuarios/${id}`, payload)
  toast.show('Contraseña actualizada', { type: 'success' })
      setPwdOpen(false)
      // optionally logout user if backend invalidates session; keep them logged in otherwise
    }catch(err){
      console.error('failed to change password', err)
  toast.show((err && err.message) || 'Error cambiando la contraseña', { type: 'error' })
    }finally{
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-5 text-ink-900">
      <h2 className="text-2xl font-semibold">Mi cuenta</h2>

      <section className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-ink-500">
          {user && (user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U')}
        </div>
        <div className="flex-1">
          {loading ? (
            <div className="text-ink-500">Cargando datos...</div>
          ) : error ? (
            <div className="text-red-600">Error cargando datos de la cuenta</div>
          ) : user ? (
            <>
              <div className="text-lg font-semibold">{user.nombre || user.name || 'Usuario'}</div>
              <div className="text-sm text-ink-500">{user.correo || user.email || ''}</div>
            </>
          ) : (
            <div className="text-ink-500">No se encontraron datos del usuario.</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={openEdit} className="px-3 py-1 rounded-full bg-brand-500 text-white text-sm">Editar</button>
          <button onClick={openPwd} className="px-3 py-1 rounded-full bg-brand-100 text-ink-900 text-sm">Cambiar contraseña</button>
        </div>
      </section>

      {/* Admin: Crear producto */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin') && (
        <section className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold">Panel administrador</h3>
          <div className="mt-3">
            <button onClick={openCreate} className="px-3 py-2 rounded-lg bg-brand-600 text-white">Crear producto</button>
          </div>
        </section>
      )}

      {/* Admin/Staff: Gestionar pedidos activos (collapsible, similar to products) */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin' || authUser.rol === 'staff' || authUser.role === 'staff' || authUser.rol === 'empleado' || authUser.role === 'empleado') && (
        <section className="bg-white rounded-2xl shadow-card">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={()=>setOrdersOpenPanel(v=>!v)}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Gestionar pedidos activos</h3>
              <span className="text-sm text-ink-500">({ordersActive.length})</span>
            </div>
            <div>
              <button onClick={(e)=>{ e.stopPropagation(); setOrdersOpenPanel(v=>!v) }} className="text-ink-500">{ordersOpenPanel ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>

          {ordersOpenPanel && (
            <div className="p-4 border-t">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-44">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <select value={estadoFilter} onChange={e=>{ e.stopPropagation(); setEstadoFilter(e.target.value); setOrdersPage(1) }} className="bg-transparent outline-none text-sm text-ink-900">
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="preparando">En preparación</option>
                        <option value="listo">Listo</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  <div className="w-56">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <input
                        placeholder="Buscar pedidos... (cliente, id)"
                        value={orderSearch}
                        onChange={e=>{ e.stopPropagation(); setOrderSearch(e.target.value) }}
                        className="flex-1 bg-transparent outline-none text-sm text-ink-900"
                      />
                      <span className="text-ink-500 text-sm">🔎</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e)=>{ e.stopPropagation(); loadActiveOrders() }} className="px-3 py-2 rounded-lg bg-brand-100">Refrescar</button>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={(e)=>{ e.stopPropagation(); setOrdersPage(p=>Math.max(1, (p||1)-1)); setTimeout(()=>loadActiveOrders(), 0) }} className="px-2 py-1 rounded bg-brand-100">◀</button>
                    <div className="text-sm text-ink-500">{ordersPage}/{ordersTotalPages}</div>
                    <button onClick={(e)=>{ e.stopPropagation(); setOrdersPage(p=>Math.min((ordersTotalPages||1), (p||1)+1)); setTimeout(()=>loadActiveOrders(), 0) }} className="px-2 py-1 rounded bg-brand-100">▶</button>
                  </div>
                </div>
              </div>
              {loadingActiveOrders ? (
                <div className="text-ink-500">Cargando pedidos...</div>
              ) : ordersActive.length === 0 ? (
                <div className="text-ink-500">No hay pedidos activos.</div>
              ) : (
                (()=>{
                  const term = String(orderSearch || '').trim().toLowerCase()
                  const filtered = term ? ordersActive.filter(o=>{
                    const cliente = (o.cliente?.nombre || o.cliente?.name || o.usuario?.nombre || o.usuario?.name || o.nombre_cliente || '').toString().toLowerCase()
                    const id = String(o.id || o._id || o.numero || '').toLowerCase()
                    return cliente.includes(term) || id.includes(term)
                  }) : ordersActive

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {filtered.map((o, oIdx)=>{
                        const id = o.id || o._id || o.id_pedido || o.numero || `order-${oIdx}`
                        const items = o.items || o.detalle || []
                        const count = items.length || o.total_items || 0
                        const total = o.total || o.total_price || o.precio_total || 0
                        const cliente = o.cliente || o.usuario || {}
                        const clienteName = cliente?.nombre || cliente?.name || o.nombre_cliente || o.nombre || 'Cliente'
                        const clienteEmail = cliente?.correo || cliente?.email || cliente?.correo_electronico || ''
                        const estado = (o.estado || o.status || '').toString().toLowerCase()
                        const estadoLabels = { pendiente: 'Pendiente', preparando: 'En preparación', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado' }
                        const estadoLabel = estadoLabels[estado] || (estado ? estado : 'Pendiente')
                        const preview = items.slice(0,3)
                        return (
                          <div key={id} className="rounded-2xl bg-white shadow p-3 flex flex-col justify-between">
                            <div>
                              <div className="text-sm font-semibold truncate">{clienteName} <span className="text-ink-500 text-xs">· #{id}</span></div>
                              {clienteEmail && <div className="text-xs text-ink-500">{clienteEmail}</div>}
                              <div className="text-xs text-ink-700 mt-2">
                                {preview.map((it, idx)=>{
                                  const itKey = it.id || it._id || it.id_producto || it.product?.id || it.producto?.id || `item-${oIdx}-${idx}`
                                  const name = it.product?.nombre || it.producto?.nombre || it.nombre || it.name || it.producto_nombre || it.nombre_producto || 'Producto'
                                  const qty = it.cantidad || it.quantity || it.qty || 1
                                  const price = Number(it.product?.precio ?? it.producto?.precio ?? it.precio ?? it.price ?? 0)
                                  return (
                                    <div key={itKey} className="flex justify-between">
                                      <div className="truncate">{qty} x {name}</div>
                                      <div className="text-ink-500 ml-2">{price ? `$${price.toLocaleString('es-CO')}` : ''}</div>
                                    </div>
                                  )
                                })}
                                {items.length > 3 && <div className="text-xs text-ink-500">+{items.length - 3} más</div>}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-ink-500">{count} items · ${Number(total).toLocaleString('es-CO')}</div>
                              <div className="flex gap-2 items-center">
                                <button onClick={(e)=>{ e.stopPropagation(); openViewOrder(o) }} className="px-3 py-1 rounded-lg bg-brand-100 text-ink-900 text-sm">Ver</button>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-ink-500">Estado: {estadoLabel}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          )}
        </section>
      )}

      {/* Admin: Generar QR para una mesa */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin') && (
        <section className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold">Gestionar mesas</h3>
          <p className="text-sm text-ink-500 mt-2">Crea un código QR para una mesa específica. Esta acción sólo puede realizarla un administrador.</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2">
              <label className="block text-sm">ID de la mesa</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={qrMesaInput} onChange={e=>setQrMesaInput(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={async ()=>{
                setQrLoading(true)
                try{
                  const mesaId = Math.max(1, parseInt(qrMesaInput) || 1)
                  const path = `/api/mesas/${mesaId}/generate-qr`
                  console.debug('[QR] request path ->', path)
                  // try GET first; if 404, attempt POST fallback (some backends implement QR generation as POST)
                  let blob = null
                  try{
                    blob = await apiBlob.getBlob(path, { credentials: 'include' })
                  }catch(gErr){
                    console.warn('[QR] GET failed', gErr)
                    if(gErr && gErr.status === 404){
                      console.debug('[QR] GET returned 404 — trying POST fallback')
                      // try POST fallback
                      blob = await apiBlob.fetchBlob(path, { method: 'POST', credentials: 'include' })
                    } else {
                      throw gErr
                    }
                  }

                  const obj = URL.createObjectURL(blob)
                  // revoke previous
                  try{ if(qrUrl) URL.revokeObjectURL(qrUrl) }catch(_){ }
                  setQrUrl(obj)
                  toast.show('QR generado (previsualización lista)', { type: 'success' })
                }catch(err){
                  console.error('[QR] generation failed', err)
                  // surface server error body when available
                  const msg = err && (err.data || err.message) || 'Error generando QR'
                  toast.show(String(msg), { type: 'error' })
                }finally{ setQrLoading(false) }
              }} className="px-3 py-2 rounded-lg bg-brand-600 text-white">{qrLoading ? 'Generando...' : 'Generar QR'}</button>
              <button onClick={()=>{
                if(!qrUrl){ toast.show('No hay QR generado aún', { type: 'error' }); return }
                const a = document.createElement('a')
                a.href = qrUrl
                const dlId = parseInt(qrMesaInput) || 'qr'
                a.download = `mesa-${dlId}.png`
                document.body.appendChild(a)
                a.click()
                a.remove()
              }} className="px-3 py-2 rounded-lg bg-brand-100 text-ink-900">Descargar</button>
              <button onClick={()=>{ if(qrUrl){ try{ URL.revokeObjectURL(qrUrl) }catch(_){ } setQrUrl(null) } }} className="px-3 py-2 rounded-lg bg-gray-100 text-ink-700">Limpiar</button>
            </div>
          </div>
          {qrUrl ? (
            <div className="mt-4 flex items-center gap-4">
              <img src={qrUrl} alt={`QR mesa ${qrMesaInput}`} className="w-48 h-48 object-contain bg-white p-2 border" />
              <div className="text-sm text-ink-500">Abre en nueva pestaña o descarga el archivo para compartir el QR con el cliente.</div>
            </div>
          ) : null}

          {/* Crear mesa */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold">Crear nueva mesa</h4>
            <p className="text-sm text-ink-500">Crea una mesa con id_mesa, estado y ubicación. El campo codigo_qr se insertará cuando generes el QR.</p>
            <form onSubmit={async (e)=>{ e.preventDefault();
              setCreatingMesa(true)
              try{
                const payload = {}
                if(newMesaId !== '') payload.id_mesa = Number(newMesaId)
                payload.estado = newMesaEstado || 'libre'
                if(newMesaUbicacion) payload.ubicacion = newMesaUbicacion
                // Nota: el campo `codigo_qr` ya no se gestiona desde el frontend (se eliminará de la BD)
                // debug: log the exact JSON payload sent to the backend for mesa creation
                try{ console.debug('[MESAS] create payload ->', payload) }catch(_){ }
                const res = await api.post('/api/mesas', payload)
                try{ console.debug('[MESAS] create response ->', res) }catch(_){ }
                toast.show('Mesa creada', { type: 'success' })
                // clear form
                setNewMesaId('')
                setNewMesaEstado('libre')
                setNewMesaUbicacion('')
              }catch(err){
                console.error('failed to create mesa', err)
                const serverMsg = err && (err.data?.error || err.data?.message || err.data) || err.message
                toast.show(serverMsg || 'Error creando mesa', { type: 'error' })
              }finally{ setCreatingMesa(false) }
            }} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm">ID de la mesa</label>
                <input type="number" min="1" value={newMesaId} onChange={e=>setNewMesaId(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm">Estado</label>
                <select value={newMesaEstado} onChange={e=>setNewMesaEstado(e.target.value)} className="w-full border rounded-md px-3 py-2">
                  <option value="libre">Libre</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="reservada">Reservada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Ubicación</label>
                <input value={newMesaUbicacion} onChange={e=>setNewMesaUbicacion(e.target.value)} className="w-full border rounded-md px-3 py-2" />
              </div>
              <div className="md:col-span-3">
                <div className="flex gap-2 mt-2">
                  <button type="submit" disabled={creatingMesa} className="px-3 py-2 rounded-lg bg-brand-600 text-white">{creatingMesa ? 'Creando...' : 'Crear mesa'}</button>
                  <button type="button" onClick={()=>{ setNewMesaId(''); setNewMesaEstado('libre'); setNewMesaUbicacion('') }} className="px-3 py-2 rounded-lg bg-gray-100">Limpiar</button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Admin: Gestionar categorías (collapsible, similar style to products) */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin') && (
        <section className="bg-white rounded-2xl shadow-card">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={()=>setCategoriesOpenPanel(v=>!v)}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Gestionar categorías</h3>
              <span className="text-sm text-ink-500">({categories.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-56">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                  <input
                    placeholder="Buscar categorías..."
                    value={categorySearch}
                    onChange={e=>setCategorySearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-ink-900"
                    onClick={e=>e.stopPropagation()}
                  />
                  <span className="text-ink-500 text-sm">🔎</span>
                </div>
              </div>
              <button onClick={(e)=>{ e.stopPropagation(); openCreateCategory() }} className="px-3 py-2 rounded-lg bg-brand-600 text-white">Crear</button>
              <button onClick={(e)=>{ e.stopPropagation(); setCategoriesOpenPanel(v=>!v) }} className="ml-2 text-ink-500">{categoriesOpenPanel ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>

          {categoriesOpenPanel && (
            <div className="p-4 border-t">
              {loadingCategoriesList ? (
                <div className="text-ink-500">Cargando categorías...</div>
              ) : categories.length === 0 ? (
                <div className="text-ink-500">No hay categorías.</div>
              ) : (
                (()=>{
                  const term = String(categorySearch || '').trim().toLowerCase()
                  const filtered = term ? categories.filter(c=>{
                    const nombre = (c.nombre || c.name || '').toString().toLowerCase()
                    return nombre.includes(term)
                  }) : categories

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filtered.map(c=>{
                        const id = c.id || c.id_categoria || c.idCategoria || (c.nombre||c.name)
                        return (
                          <div key={id} className="rounded-2xl bg-white shadow p-3 flex flex-col justify-between">
                            <div>
                              <div className="text-sm font-semibold overflow-hidden">{c.nombre || c.name}</div>
                              <div className="text-xs text-ink-500 mt-2 h-10 overflow-hidden">{c.descripcion || c.description}</div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button onClick={(e)=>{ e.stopPropagation(); openEditCategory(c) }} className="flex-1 px-2 py-1 rounded-lg bg-brand-100 text-ink-900 text-sm">Editar</button>
                              <button onClick={(e)=>{ e.stopPropagation(); handleDeleteCategory(c) }} disabled={categoryActionLoading} className="px-2 py-1 rounded-lg bg-red-600 text-white text-sm">Eliminar</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          )}
        </section>
      )}

      {/* Admin: Gestionar productos (collapsible) */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin') && (
        <section className="bg-white rounded-2xl shadow-card">
          <div className="p-4 flex items-center justify-between cursor-pointer" onClick={()=>setProductsOpen(v=>!v)}>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Gestionar productos</h3>
              <span className="text-sm text-ink-500">({products.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-56">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                  <input
                    placeholder="Buscar productos..."
                    value={productSearch}
                    onChange={e=>setProductSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm text-ink-900"
                    onClick={e=>e.stopPropagation()}
                  />
                  <span className="text-ink-500 text-sm">🔎</span>
                </div>
              </div>
              <button onClick={(e)=>{ e.stopPropagation(); setCreateOpen(true) }} className="px-3 py-2 rounded-lg bg-brand-600 text-white">Crear</button>
              <button onClick={(e)=>{ e.stopPropagation(); setProductsOpen(v=>!v) }} className="ml-2 text-ink-500">{productsOpen ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>

          {productsOpen && (
            <div className="p-4 border-t">
              {loadingProducts ? (
                <div className="text-ink-500">Cargando productos...</div>
              ) : products.length === 0 ? (
                <div className="text-ink-500">No hay productos encontrados.</div>
              ) : (
                (()=>{
                  const term = String(productSearch || '').trim().toLowerCase()
                  const filtered = term ? products.filter(p=>{
                    const nombre = (p.nombre || p.name || '').toString().toLowerCase()
                    const desc = (p.descripcion || p.description || '').toString().toLowerCase()
                    return nombre.includes(term) || desc.includes(term)
                  }) : products

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {filtered.map(p=>{
                        const id = p.id || p.id_producto || p.idProduct || (p.nombre||p.name)
                        const img = p.imagen_url || p.image || p.img || '/images/burger.jpg'
                        const precio = Number(p.precio ?? p.price ?? 0)
                        return (
                          <div key={id} className="rounded-2xl bg-white shadow p-2">
                            <div className="w-full rounded-xl mb-2 overflow-hidden relative" style={{ paddingTop: '100%' }}>
                              <div className="absolute inset-0 bg-gray-200 bg-cover bg-center" style={{ backgroundImage:`url('${img}')` }} />
                            </div>
                            <div className="text-sm h-6 overflow-hidden font-semibold">{p.nombre || p.name}</div>
                            <div className="text-xs text-ink-500">${precio.toLocaleString('es-CO')}</div>
                            <div className="mt-2 flex gap-2">
                              <button onClick={(e)=>{ e.stopPropagation(); openEditProduct(p) }} className="flex-1 px-2 py-1 rounded-lg bg-brand-100 text-ink-900 text-sm">Editar</button>
                              <button onClick={(e)=>{ e.stopPropagation(); handleDeleteProduct(id) }} disabled={productActionLoading} className="px-2 py-1 rounded-lg bg-red-600 text-white text-sm">Eliminar</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          )}
        </section>
      )}

      {/* Suggestions - hide for admin and employee roles */}
      {!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin' || authUser.rol === 'staff' || authUser.role === 'staff' || authUser.rol === 'empleado' || authUser.role === 'empleado')) && (
        <section className="bg-white rounded-2xl p-4 shadow-card">
          <h3 className="font-semibold">Opciones</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={()=>navigate('/orders')} className="text-left px-3 py-2 rounded-lg bg-brand-100">Ver pedidos</button>
            <button onClick={()=>navigate('/account/favorites')} className="text-left px-3 py-2 rounded-lg bg-brand-100">Favoritos</button>
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold text-ink-900">Cuenta</h3>
        <p className="text-xs text-ink-500 mt-2">Eliminar tu cuenta es irreversible. Se borrarán tus datos y pedidos asociados.</p>
        <div className="mt-4">
          <button onClick={openConfirm} className="rounded-full bg-red-600 hover:bg-red-700 text-white px-4 py-2">Eliminar cuenta</button>
        </div>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Eliminar cuenta</h3>
            <p className="text-sm text-ink-600 mt-2">¿Estás seguro? Esta acción eliminará tu cuenta permanentemente.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white">{deleting ? 'Eliminando...' : 'Eliminar cuenta'}</button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEdit} />
          <form onSubmit={handleEditSubmit} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Editar perfil</h3>
            <p className="text-sm text-ink-600 mt-2">Actualiza tu nombre y correo. Estos cambios serán visibles en tu cuenta.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Nombre
                <input value={editNombre} onChange={e=>setEditNombre(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Correo
                <input type="email" value={editCorreo} onChange={e=>setEditCorreo(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={editLoading} className="px-4 py-2 rounded-full bg-brand-500 text-white">{editLoading ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {pwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closePwd} />
          <form onSubmit={handleChangePassword} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Cambiar contraseña</h3>
            <p className="text-sm text-ink-600 mt-2">Introduce tu contraseña actual y la nueva. La nueva contraseña debe tener al menos 6 caracteres.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Contraseña actual
                <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Nueva contraseña
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Confirmar nueva contraseña
                <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closePwd} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={pwdLoading} className="px-4 py-2 rounded-full bg-brand-500 text-white">{pwdLoading ? 'Guardando...' : 'Cambiar contraseña'}</button>
            </div>
          </form>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreate} />
          <form onSubmit={handleCreateProduct} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Crear producto</h3>
            <p className="text-sm text-ink-600 mt-2">Rellena los campos para crear un nuevo producto.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Nombre
                <input value={prodNombre} onChange={e=>{ setProdNombre(e.target.value); setCreateNameError('') }} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              {createNameError && (
                <div className="mt-2 bg-red-600 text-white rounded px-3 py-2 text-center text-sm">{createNameError}</div>
              )}
              <label className="block text-sm">Descripción
                <input value={prodDescripcion} onChange={e=>setProdDescripcion(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Precio
                <input value={prodPrecio} onChange={e=>setProdPrecio(e.target.value)} type="number" step="0.01" className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Categoría
                <select value={prodCategoria} onChange={e=>setProdCategoria(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2">
                  <option value="">-- Selecciona --</option>
                  {categories.map(cat=>{
                    const id = cat.id_categoria ?? cat.id
                    return <option key={id} value={id}>{cat.nombre || cat.name}</option>
                  })}
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={prodDisponible} onChange={e=>setProdDisponible(e.target.checked)} /> Disponible</label>
              <label className="block text-sm">Imagen
                <input type="text" value={prodImageUrl} onChange={e=>setProdImageUrl(e.target.value)} placeholder="https://example.com/imagen.jpg" className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closeCreate} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={creating} className="px-4 py-2 rounded-full bg-brand-500 text-white">{creating ? 'Creando...' : 'Crear producto'}</button>
            </div>
          </form>
        </div>
      )}

      {createCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeCreateCategory} />
          <form onSubmit={handleCreateCategory} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Crear categoría</h3>
            <p className="text-sm text-ink-600 mt-2">Rellena el nombre de la nueva categoría.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Nombre
                <input value={createCategoryName} onChange={e=>{ setCreateCategoryName(e.target.value); setCreateCategoryError('') }} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              {createCategoryError && (
                <div className="mt-2 bg-red-600 text-white rounded px-3 py-2 text-center text-sm">{createCategoryError}</div>
              )}
              <label className="block text-sm">Descripción
                <textarea value={createCategoryDescripcion} onChange={e=>setCreateCategoryDescripcion(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" rows={3} />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={createCategoryActivo} onChange={e=>setCreateCategoryActivo(e.target.checked)} /> Activo</label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closeCreateCategory} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={creatingCategory} className="px-4 py-2 rounded-full bg-brand-500 text-white">{creatingCategory ? 'Creando...' : 'Crear categoría'}</button>
            </div>
          </form>
        </div>
      )}

      {editCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditCategory} />
          <form onSubmit={handleEditCategorySubmit} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Editar categoría</h3>
            <p className="text-sm text-ink-600 mt-2">Actualiza el nombre de la categoría.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Nombre
                <input value={editCategoryName} onChange={e=>setEditCategoryName(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Descripción
                <textarea value={editCategoryDescripcion} onChange={e=>setEditCategoryDescripcion(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" rows={3} />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editCategoryActivo} onChange={e=>setEditCategoryActivo(e.target.checked)} /> Activo</label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closeEditCategory} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={categoryActionLoading} className="px-4 py-2 rounded-full bg-brand-500 text-white">{categoryActionLoading ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {viewOrderOpen && viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeViewOrder} />
          <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-lg p-4">
            <h3 className="text-lg font-semibold">Pedido #{viewingOrder.id || viewingOrder._id || viewingOrder.numero}</h3>
            <p className="text-sm text-ink-600 mt-2">Cliente: {viewingOrder.cliente?.nombre || viewingOrder.cliente?.name || viewingOrder.usuario?.nombre || viewingOrder.usuario?.name || viewingOrder.nombre_cliente}</p>
            <div className="mt-2">
              <label className="text-sm">Estado</label>
              <div className="mt-1">
                <select value={viewOrderEstado} onChange={e=>setViewOrderEstado(e.target.value)} className="w-full border rounded px-2 py-1">
                  <option value="pendiente">Pendiente</option>
                  <option value="preparando">En preparación</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(viewingOrder.items || viewingOrder.detalle || []).map((it, idx)=>{
                const title = it.product?.nombre || it.nombre || it.name || 'Producto'
                const qty = it.cantidad || it.quantity || it.qty || 1
                const price = Number(it.product?.precio ?? it.precio ?? it.price ?? 0)
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="text-sm">{title} <span className="text-ink-500 text-xs">· {qty}</span></div>
                    <div className="text-sm text-ink-700">${(price * qty).toLocaleString('es-CO')}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 text-sm text-ink-700">Total: ${Number(viewingOrder.total || viewingOrder.total_price || viewingOrder.precio_total || 0).toLocaleString('es-CO')}</div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeViewOrder} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cerrar</button>
              <button onClick={()=>updateOrderStatus(_getOrderId(viewingOrder), viewOrderEstado)} disabled={orderActionLoading} className="px-4 py-2 rounded-full bg-brand-500 text-white">Guardar estado</button>
            </div>
          </div>
        </div>
      )}

      {editProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditProduct} />
          <form onSubmit={handleEditProductSubmit} role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Editar producto</h3>
            <p className="text-sm text-ink-600 mt-2">Actualiza los campos del producto. Si subes una nueva imagen, reemplazará la existente.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">Nombre
                <input value={editProdNombre} onChange={e=>{ setEditProdNombre(e.target.value); setEditNameError('') }} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              {editNameError && (
                <div className="mt-2 bg-red-600 text-white rounded px-3 py-2 text-center text-sm">{editNameError}</div>
              )}
              <label className="block text-sm">Descripción
                <input value={editProdDescripcion} onChange={e=>setEditProdDescripcion(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Precio
                <input value={editProdPrecio} onChange={e=>setEditProdPrecio(e.target.value)} type="number" step="0.01" className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
              <label className="block text-sm">Categoría
                <select value={editProdCategoria} onChange={e=>setEditProdCategoria(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2">
                  <option value="">-- Selecciona --</option>
                  {categories.map(cat=>{
                    const id = cat.id_categoria ?? cat.id
                    return <option key={id} value={id}>{cat.nombre || cat.name}</option>
                  })}
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editProdDisponible} onChange={e=>setEditProdDisponible(e.target.checked)} /> Disponible</label>
              <label className="block text-sm">Imagen URL (opcional)
                <input type="text" value={editProdImageUrl} onChange={e=>setEditProdImageUrl(e.target.value)} placeholder="https://example.com/imagen.jpg" className="mt-1 w-full border rounded-md px-3 py-2" />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={closeEditProduct} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button type="submit" disabled={productActionLoading} className="px-4 py-2 rounded-full bg-brand-500 text-white">{productActionLoading ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
    