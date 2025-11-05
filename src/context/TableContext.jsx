import React, { createContext, useContext, useEffect, useState } from 'react'

const TableContext = createContext(null)

const STORAGE_KEY = 'mesa'

export function TableProvider({ children }){
  const [mesa, setMesaState] = useState(()=>{
    if(typeof window === 'undefined') return null
    try{ const raw = sessionStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null }catch{ return null }
  })

  useEffect(()=>{
    // keep sessionStorage in sync
    try{
      if(mesa) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mesa))
      else sessionStorage.removeItem(STORAGE_KEY)
    }catch(e){}
  }, [mesa])

  function setMesa({ mesaId, venue }){
    const normalized = {
      mesaId: mesaId == null ? null : Number(mesaId),
      venue: venue == null ? null : String(venue)
    }
    setMesaState(normalized)
  }

  function clearMesa(){
    setMesaState(null)
  }

  const value = { mesa, setMesa, clearMesa }

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>
}

export function useTable(){
  const ctx = useContext(TableContext)
  if(!ctx) throw new Error('useTable must be used within TableProvider')
  return ctx
}

export default TableContext
