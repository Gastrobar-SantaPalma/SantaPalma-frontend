import { createContext, useContext, useEffect, useState } from 'react'
import { setToken as apiSetToken, clearToken as apiClearToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [token, setToken] = useState(()=>{
    if(typeof window === 'undefined') return null
    return localStorage.getItem('token')
  })

  // helper to mark authenticated state
  const login = (t)=>{
    apiSetToken(t)
    setToken(t)
  }

  const logout = ()=>{
    apiClearToken()
    setToken(null)
  }

  useEffect(()=>{
    // ensure localStorage and api client are in sync on mount
    const stored = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if(stored && !token){
      // sync client side
      apiSetToken(stored)
      setToken(stored)
    }
  }, [])

  const value = {
    token,
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
