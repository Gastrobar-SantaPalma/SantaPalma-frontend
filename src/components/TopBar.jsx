import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useState } from 'react'

export default function TopBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function openConfirm(){ setConfirmOpen(true) }
  function closeConfirm(){ setConfirmOpen(false) }

  function confirmLogout(){
    // perform logout and navigate
    logout()
    setConfirmOpen(false)
    navigate('/login')
  }

  return (
    <>
      <header className="h-14 px-4 flex items-center justify-between bg-white shadow-sm">
        <button aria-label="menu" className="text-2xl text-ink-900">☰</button>
        <img src="/logo.svg" alt="Santa Palma" className="h-6" onError={(e)=>{e.currentTarget.remove()}}/>
        <button onClick={openConfirm} aria-label="logout" className="rounded-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm font-semibold">Salir</button>
      </header>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Confirmar cierre de sesión</h3>
            <p className="text-sm text-ink-600 mt-2">¿Estás seguro que deseas cerrar la sesión? Se cerrará tu sesión actual.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white">Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
