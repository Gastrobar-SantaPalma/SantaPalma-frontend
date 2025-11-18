import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  correo: z.string().email('Email inválido'),
  contrasena: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.contrasena === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export default function Signup(){
  const nav = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data)=>{
    setError(null)
    setLoading(true)
    try{
      // Only send fields supported by the backend (nombre, correo, contrasena, rol)
      const payload = {
        nombre: data.nombre,
        correo: data.correo,
        contrasena: data.contrasena,
        rol: 'cliente'
      }
      const res = await api.post('/api/usuarios', payload, { credentials: 'omit', noAuth: true })
      if (import.meta.env.MODE === 'development') {
        console.debug('[signup][dev] created user response ->', res)
      }
      // If backend returns a token directly or an object with token, use it.
      // Otherwise, attempt to immediately authenticate the new user.
      const maybeToken = res && (res.token || (typeof res === 'string' ? res : null))
      if(maybeToken){
        login(res)
      }else{
        try{
          if (import.meta.env.MODE === 'development') console.debug('[signup][dev] attempting auto-login for', data.correo)
          const auth = await api.post('/api/usuarios/login', { correo: data.correo, contrasena: data.contrasena }, { credentials: 'omit', noAuth: true })
          if (import.meta.env.MODE === 'development') console.debug('[signup][dev] auto-login response ->', auth)
          // login will handle token/user shapes
          login(auth)
        }catch(loginErr){
          if (import.meta.env.MODE === 'development') console.debug('[signup][dev] auto-login failed ->', loginErr)
          // If automatic login fails, still set user if returned by create endpoint
          login(res)
        }
      }
      nav('/home')
    }catch(err){
      console.error('signup error', err)
      const msg = err && (err.data?.message || err.message || JSON.stringify(err.data) || 'Error')
      setError(msg)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-cover bg-center" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/IMG_6989.JPG')"}}>
      <div className="bg-white rounded-2xl shadow-card p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-ink-900">Crear cuenta</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input {...register('nombre')} className="w-full border rounded-lg px-3 py-2" placeholder="Nombre" />
            {errors.nombre && <div className="text-sm text-red-600">{errors.nombre.message}</div>}
          </div>

          <div>
            <input {...register('correo')} type="email" autoComplete="email" className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
            {errors.correo && <div className="text-sm text-red-600">{errors.correo.message}</div>}
          </div>

          <div>
            <input {...register('contrasena')} type="password" autoComplete="new-password" className="w-full border rounded-lg px-3 py-2" placeholder="Contraseña" />
            {errors.contrasena && <div className="text-sm text-red-600">{errors.contrasena.message}</div>}
          </div>

          <div>
            <input {...register('confirmPassword')} type="password" autoComplete="new-password" className="w-full border rounded-lg px-3 py-2" placeholder="Confirmar contraseña" />
            {errors.confirmPassword && <div className="text-sm text-red-600">{errors.confirmPassword.message}</div>}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-full py-3 font-semibold">
            {loading ? 'Procesando...' : 'Registrarme'}
          </button>
        </form>
      </div>
    </div>
  )
}
