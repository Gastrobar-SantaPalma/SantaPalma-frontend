import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast.jsx'

export default function Account(){
  const { logout } = useAuth()
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

  const { token } = useAuth()

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      try{
        // Only attempt to fetch /me when we have a token (prevent cookie-based anonymous sessions)
        if(!token){
          if(mounted) setUser(null)
          return
        }
        // fetch user profile using token; avoid sending cookies
        const res = await api.get('/api/usuarios/me', { credentials: 'omit' })
        if(mounted) setUser(res)
      }catch(e){
        console.warn('failed to load user via /me, attempting fallback', e)
        // fallback: try /api/usuarios (may return array) or profile
        try{
          const res2 = await api.get('/api/usuarios', { credentials: 'omit' })
          if(Array.isArray(res2)){
            // try to pick first (best-effort)
            if(mounted) setUser(res2[0] || null)
          }else if(res2 && res2.user){
            if(mounted) setUser(res2.user)
          }else{
            if(mounted) setUser(null)
          }
        }catch(e2){
          console.error('failed to load user', e, e2)
          if(mounted) setError(e2)
        }
      }finally{
        if(mounted) setLoading(false)
      }
    }
    load()
    return ()=>{ mounted = false }
  }, [token])

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
    </div>
  )
}
    