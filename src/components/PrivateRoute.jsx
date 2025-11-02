import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }){
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if(!isAuthenticated){
    // preserve the attempted location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
