import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTable } from '../context/TableContext'

export default function TableLanding(){
  const { venue, tableId } = useParams()
  const { setMesa } = useTable()
  const nav = useNavigate()

  useEffect(()=>{
    // validate params
    if(!tableId){
      nav('/', { replace: true })
      return
    }
    const id = Number(tableId)
    if(Number.isNaN(id) || id <= 0){
      nav('/', { replace: true })
      return
    }
    // set in context and sessionStorage
    setMesa({ mesaId: id, venue: venue || null })
    // redirect to menu/home
    nav('/home', { replace: true })
  }, [venue, tableId])

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-lg font-semibold">Redirigiendo...</div>
        <div className="text-sm text-ink-500 mt-2">Si no eres redirigido automáticamente, <a href="/home" className="text-brand-600 underline">ir al menú</a></div>
      </div>
    </div>
  )
}
