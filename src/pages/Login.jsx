import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext";


export default function Login() {
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()

  const submit = async (e)=>{
    e.preventDefault();
    setError(null)
    setLoading(true)
    try{
      const form = new FormData(e.target)
      if(tab === 'signup'){
        // Signup inline: send nombre, correo, contrasena and role cliente
        const payload = {
          nombre: form.get('nombre'),
          correo: form.get('email'),
          contrasena: form.get('password'),
          rol: 'cliente'
        }
        const res = await api.post('/api/usuarios', payload, { credentials: 'omit', noAuth: true })
        // backend might return a token string or an object containing the token/user.
        // Prefer passing the full response to `login()` so the AuthContext can extract token/user.
        const maybeToken = res && (res.token || res.tokenString || res.accessToken || (typeof res === 'string' ? res : null))
        if (maybeToken) {
          login(res)
          nav('/home')
          return
        }
        // If no token returned, attempt an automatic login using the provided credentials
        try {
          if (import.meta.env.MODE === 'development') console.debug('[login][dev] signup returned no token, attempting auto-login for', payload.correo)
          const auth = await api.post('/api/usuarios/login', { correo: payload.correo, contrasena: payload.contrasena }, { credentials: 'omit', noAuth: true })
          if (import.meta.env.MODE === 'development') console.debug('[login][dev] auto-login response ->', auth)
          login(auth)
          nav('/home')
          return
        } catch (e) {
          if (import.meta.env.MODE === 'development') console.debug('[login][dev] auto-login failed after signup ->', e)
          // If auto-login fails, show success and switch to login view
          setTab('login')
          setError(null)
          setLoading(false)
          return
        }
      }

      // login flow
      const formLogin = new FormData(e.target)
      const payload = {
        correo: formLogin.get('email'),
        contrasena: formLogin.get('password')
      }
      console.log("ENVIANDO PAYLOAD:", payload);
  const res = await api.post('/api/usuarios/login', payload, { credentials: 'omit', noAuth: true })
  // prefer passing the whole response to login() so context can store user if provided
  login(res)
      nav('/home')
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
  <div className="bg-white rounded-2xl shadow-card p-6 w-full max-w-sm min-h-[360px]">

      
      
        {/* Tabs */}
        <div className="relative mb-6">
          <div className="flex gap-2 bg-sheet-100 rounded-full p-1">
            {/* sliding background */}
            <div aria-hidden
              className={`absolute top-1 left-1 h-[calc(100%-0.5rem)] w-1/2 rounded-full bg-brand-600 transform transition-transform duration-300 ease-in-out ${tab==='signup' ? 'translate-x-full' : 'translate-x-0'}`}
            />

            <button onClick={()=>setTab("login")}
              className={`relative flex-1 rounded-full py-2 ${tab==="login"?"text-white":"text-ink-700"}`}>
              Iniciar sesión
            </button>

             <button onClick={()=>setTab('signup')}
              className={`relative flex-1 rounded-full py-2 ${tab==="signup"?"text-white":"text-ink-700"}`}>
              Registrarme
            </button>
          </div>
        </div>

      

         {/* Título */}
        <h2 className="text-xl font-semibold mb-4 text-ink-900">
          {tab==="login" ? "Bienvenido a Santa Palma" : "Crear tu cuenta"}
        </h2>


        {/* Formulario */}
        <form onSubmit={submit} className="space-y-3 transition-[opacity,transform] duration-300 ease-in-out" style={{ opacity: 1 }}>
          {tab==="signup" && (
            <input name="nombre" className="w-full border rounded-lg px-3 py-2" placeholder="Nombre completo" />
          )}

          <input name="email" autoComplete="email" className="w-full border rounded-lg px-3 py-2" placeholder="Correo electrónico" />
          <input name="password" autoComplete="current-password" className="w-full border rounded-lg px-3 py-2" placeholder="Contraseña" type="password" />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-full py-3 font-semibold">
            {loading ? 'Procesando...' : (tab==="login" ? "Iniciar sesión" : "Registrarme")}
          </button>
        </form>

        <div className="mt-3">
          {tab==="login" && (
          <p className="text-right text-sm mt-2">
            ¿Olvidaste tu contraseña? <span className="text-brand-600 underline">Recuperar</span>
          </p>
          )}
        </div>
      </div>
    </div>
  );
}
