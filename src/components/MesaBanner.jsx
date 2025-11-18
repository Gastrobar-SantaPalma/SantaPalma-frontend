import React from 'react'
import { useTable } from '../context/TableContext'
import { useNavigate } from 'react-router-dom'

export default function MesaBanner(){
  const { mesa, clearMesa } = useTable()
  const nav = useNavigate()

  if(!mesa || !mesa.mesaId) return null

  function onChange(){
    clearMesa()
    // clear sessionStorage key and redirect to landing/scan
    try{ sessionStorage.removeItem('mesa') }catch(e){}
    // navigate to homepage where user can re-scan or click change
    nav('/')
  }

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-ink-600">Mesa <span className="font-semibold">{mesa.mesaId}</span> {mesa.venue ? <span className="text-xs text-ink-500">(Sede {mesa.venue})</span> : null}</div>
      </div>
      <div>
        <button onClick={onChange} className="text-sm text-brand-600 underline">Cambiar mesa</button>
      </div>
    </div>
  )
}
