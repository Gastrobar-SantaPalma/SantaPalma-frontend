import { createContext, useContext, useEffect, useState } from 'react'
import { setToken as apiSetToken, clearToken as apiClearToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [token, setToken] = useState(()=>{
    if(typeof window === 'undefined') return null
    return localStorage.getItem('token')
  })

  const [user, setUser] = useState(()=>{
    if(typeof window === 'undefined') return null
    try{ const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null }catch{ return null }
  })

  // helper to mark authenticated state
  // accepts either a token string or a response object { token, user }
  const login = (payload)=>{
    if(!payload) return
    if (import.meta.env.MODE === 'development') {
      // Mask token-like strings/objects for logs
      try{
        const preview = typeof payload === 'string' ? payload.slice(0,40) : (payload && payload.token ? (String(payload.token).slice(0,40)) : '[object]')
        console.debug('[auth][dev] login() received payload preview ->', preview)
      }catch(e){/* ignore */}
    }
    if(typeof payload === 'string'){
      apiSetToken(payload)
      setToken(payload)
      return
    }
    // payload is an object - try to extract token and user from common shapes
    const maybeToken = payload.token || payload.tokenString || payload.accessToken || (payload.data && (payload.data.token || payload.data.accessToken)) || (payload.result && payload.result.token) || null
    const maybeUser = payload.user || payload.usuario || (payload.data && (payload.data.user || payload.data.usuario)) || payload.result || null
    if(maybeToken){
      try{ apiSetToken(maybeToken) }catch(_){ }
      try{ setToken(maybeToken) }catch(_){ }
    }
    if(maybeUser){
      try{ localStorage.setItem('user', JSON.stringify(maybeUser)) }catch{}
      try{ setUser(maybeUser) }catch(_){ }
    }
    // Emit a global event so other parts of the app can react to a new login (e.g., clear caches)
    try{ if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:login', { detail: { token: maybeToken, user: maybeUser } })) }catch(e){}
  }

  const logout = ()=>{
    apiClearToken()
    setToken(null)
    setUser(null)
    try{ localStorage.removeItem('user') }catch{}
    // Emit global logout event so other parts can react (clear caches/state)
    try{ if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:logout')) }catch(e){}
  }

  useEffect(()=>{
    // ensure localStorage and api client are in sync on mount
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if(stored && !token){
      // sync client side
      apiSetToken(stored)
      setToken(stored)
    }
    // also ensure user from localStorage is applied to state
    if(typeof window !== 'undefined' && !user){
      try{ const raw = localStorage.getItem('user'); if(raw) setUser(JSON.parse(raw)) }catch(e){ /* ignore */ }
    }
  }, [])

  const value = {
    token,
    user,
    setUser,
    isAuthenticated: !!token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  const ctx = useContext(AuthContext)
  if(!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
