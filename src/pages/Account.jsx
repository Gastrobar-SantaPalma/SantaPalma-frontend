import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
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
    if(!(authUser && (authUser.rol === 'admin' || authUser.role === 'admin'))) return
    // load on mount when admin
    loadProducts()
    return ()=>{ mounted = false }
  }, [authUser])

  function openConfirm(){ setConfirmOpen(true) }
  function closeConfirm(){ setConfirmOpen(false) }

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

      {/* Admin: Gestionar productos (list, editar, eliminar) */}
      {authUser && (authUser.rol === 'admin' || authUser.role === 'admin') && (
        <section className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Gestionar productos</h3>
            <div className="w-56">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                <input
                  placeholder="Buscar productos..."
                  value={productSearch}
                  onChange={e=>setProductSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-ink-900"
                />
                <span className="text-ink-500 text-sm">🔎</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
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
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map(p=>{
                  const id = p.id || p.id_producto || p.idProduct || (p.nombre||p.name)
                  const img = p.imagen_url || p.image || p.img || '/images/burger.jpg'
                  const precio = Number(p.precio ?? p.price ?? 0)
                  return (
                    <div key={id} className="rounded-2xl bg-white shadow p-2">
                      <div className="h-36 rounded-xl bg-gray-200 mb-2 bg-cover bg-center" style={{ backgroundImage:`url('${img}')` }} />
                      <div className="text-sm h-6 overflow-hidden font-semibold">{p.nombre || p.name}</div>
                      <div className="text-xs text-ink-500">${precio.toLocaleString('es-CO')}</div>
                      <div className="mt-2 flex gap-2">
                        <button onClick={()=>openEditProduct(p)} className="flex-1 px-2 py-1 rounded-lg bg-brand-100 text-ink-900 text-sm">Editar</button>
                        <button onClick={()=>handleDeleteProduct(id)} disabled={productActionLoading} className="px-2 py-1 rounded-lg bg-red-600 text-white text-sm">Eliminar</button>
                      </div>
                    </div>
                  )
                    })}
                  </div>
                )
              })()
            )}
          </div>
        </section>
      )}

      {/* Suggestions */}
      <section className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold">Opciones</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={()=>navigate('/orders')} className="text-left px-3 py-2 rounded-lg bg-brand-100">Ver pedidos</button>
          <button onClick={()=>navigate('/account/favorites')} className="text-left px-3 py-2 rounded-lg bg-brand-100">Favoritos</button>
        </div>
      </section>

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
    