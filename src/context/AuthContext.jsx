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
    if(typeof payload === 'string'){
      apiSetToken(payload)
      setToken(payload)
      return
    }
    // payload is an object - try to extract token and user
    const t = payload.token || payload.tokenString || (typeof payload === 'string' ? payload : null)
    const u = payload.user || payload.usuario || payload.data || null
    if(t){ apiSetToken(t); setToken(t) }
    if(u){ try{ localStorage.setItem('user', JSON.stringify(u)) }catch{}; setUser(u) }
  }

  const logout = ()=>{
    apiClearToken()
    setToken(null)
    setUser(null)
    try{ localStorage.removeItem('user') }catch{}
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
