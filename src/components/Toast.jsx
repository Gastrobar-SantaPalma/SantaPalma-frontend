import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  useEffect(()=>{
    if(toasts.length===0) return
    // auto remove toasts after 4s
    const timers = toasts.map(t=>{
      if(t.duration === 0) return null
      return setTimeout(()=>{
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, t.duration || 4000)
    })
    return ()=> timers.forEach(t=>t && clearTimeout(t))
  }, [toasts])

  const api = useMemo(()=>({
    show(message, opts = {}){
      const id = String(Date.now()) + Math.random().toString(16).slice(2)
      const toast = { id, message, type: opts.type || 'info', duration: opts.duration ?? 4000 }
      setToasts(prev => [toast, ...prev])
      return id
    },
    dismiss(id){ setToasts(prev => prev.filter(t=>t.id!==id)) }
  }), [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Centered overlay for toasts */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-3 w-full px-4 max-w-lg">
          {toasts.map(t=> (
            <div key={t.id} className={`pointer-events-auto w-full max-w-md px-4 py-3 rounded-lg shadow-lg text-white ${t.type==='error' ? 'bg-red-600' : (t.type==='success' ? 'bg-green-600' : 'bg-ink-900')}`}>
              <div className="text-sm text-center">{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
