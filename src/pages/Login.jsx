import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api/client.js";


export default function Login() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e)=>{
    e.preventDefault();
    setError(null)
    setLoading(true)
    try{
      const form = new FormData(e.target)
      if(tab === 'login'){
        // backend expects { correo, contrasena }
        const payload = {
          correo: form.get('email'),
          contrasena: form.get('password')
        }
        // send to backend's login route
        // avoid sending cookies for login (some backends reject stale session cookies)
        const res = await api.post('/api/usuarios/login', payload, { credentials: 'omit', noAuth: true })
        // backend responded with token (either raw string or { token })
        const token = res && (res.token || res || '').toString()
        if(token) setToken(token)
        nav('/home')
      } else {
        // signup: send { nombre, correo, contrasena, rol: 'cliente' }
        const payload = {
          nombre: form.get('nombre'),
          correo: form.get('email'),
          contrasena: form.get('password'),
          rol: 'cliente'
        }
        const res = await api.post('/api/usuarios', payload, { credentials: 'omit', noAuth: true })
        // if backend returns a token, save it
        const token = res && (res.token || res || '').toString()
        if(token) setToken(token)
        nav('/home')
      }
    }catch(err){
      // show richer error information (status + body) when available
      console.error('auth error', err)
      const message = err && (err.data?.message || err.message || JSON.stringify(err.data) || 'Error')
      setError(message)
    }finally{
      setLoading(false)
    }
  };

  return (


    <div 
    className= "min-h-screen grid place-items-center p-4 bg-cover bg-center"
  style={{
    backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/images/IMG_6989.JPG')",
  }}>

     {/* Logo */}
          <img src="/images/icons/Recurso_22.png" className="mx-auto mb-4 w-20 sm:w-28 md:w-32 lg:w-40 h-auto object-contain" />


    {/* Card */}
      <div className="bg-white rounded-2xl shadow-card p-6 w-full max-w-sm">

      
      
        {/* Tabs */}
        <div className="flex gap-2 bg-sheet-100 rounded-full p-1 mb-6">

          <button onClick={()=>setTab("login")}
            className={`flex-1 rounded-full py-2 ${tab==="login"?"bg-brand-600 text-white":"text-ink-700"}`}>
            Log in
          </button>

           <button onClick={()=>setTab("signup")}
            className={`flex-1 rounded-full py-2 ${tab==="signup"?"bg-brand-600 text-white":"text-ink-700"}`}>
            Sign up
          </button>
        </div>

      

         {/* Título */}
        <h2 className="text-xl font-semibold mb-4 text-ink-900">
          {tab==="login" ? "Bienvenido a Santa Palma" : "Crear cuenta"}
        </h2>


        {/* Formulario */}
        <form onSubmit={submit} className="space-y-3">
          {tab==="signup" && (
            <input name="nombre" className="w-full border rounded-lg px-3 py-2" placeholder="Nombre" />
          )}

          <input name="email" autoComplete="email" className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
          <input name="password" autoComplete="current-password" className="w-full border rounded-lg px-3 py-2" placeholder="Contraseña" type="password" />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-full py-3 font-semibold">
            {loading ? 'Procesando...' : (tab==="login" ? "Log in" : "Registrarme")}
          </button>
        </form>

        {tab==="login" && (
          <p className="text-right text-sm mt-2">
            ¿Olvidaste tu contraseña? <span className="text-brand-600 underline">Recuperar</span>
          </p>
         )}
      </div>
    </div>
  );
}
