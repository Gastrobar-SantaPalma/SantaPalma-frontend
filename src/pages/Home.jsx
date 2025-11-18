import React, { useEffect, useState, useRef } from 'react'
import { api } from '../api/client.js'
import MesaBanner from '../components/MesaBanner'
import { useCart } from '../store/cart.jsx'
import { useNavigate } from 'react-router-dom'
import { Link } from "react-router-dom"
import PendingOrderCard from "../components/PendingOrderCard"


export default function Home() {
  const SEARCH_CATEGORY_ID = '__search__'
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [loadingProds, setLoadingProds] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('') // debounced search query used for requests
  const debounceRef = useRef(null)
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [productsError, setProductsError] = useState(null)
  const [justAdded, setJustAdded] = useState(null)

  useEffect(()=>{
    async function loadCats(){
      setLoadingCats(true)
      try{
        const res = await api.get('/api/categorias', { noAuth: true })
        // backend returns array of categories
        setCategories(Array.isArray(res) ? res : [])
        if(Array.isArray(res) && res.length>0){
          // only auto-select a real category if there's no active search
          if(!query) setSelected(res[0].id_categoria || res[0].id || res[0].id_categoria)
        }
      }catch(e){
        console.error('failed to load categories', e)
        setCategories([])
      }finally{
        setLoadingCats(false)
      }
    }
    loadCats()
  }, [])

  // Clear product list when another user logs in or when logout happens
  useEffect(()=>{
    function handleAuthClear(){
      setProducts([])
      setProductsError(null)
    }
    if(typeof window !== 'undefined'){
      window.addEventListener('auth:login', handleAuthClear)
      window.addEventListener('auth:logout', handleAuthClear)
    }
    return ()=>{
      if(typeof window !== 'undefined'){
        window.removeEventListener('auth:login', handleAuthClear)
        window.removeEventListener('auth:logout', handleAuthClear)
      }
    }
  }, [])

  // when a search query is set, switch selected to the virtual 'Busqueda' category
  useEffect(()=>{
    if(query){
      setSelected(SEARCH_CATEGORY_ID)
    }else{
      // if user cleared search and no selected category, pick first real category
      if((selected === SEARCH_CATEGORY_ID || !selected) && categories && categories.length>0){
        setSelected(categories[0].id_categoria || categories[0].id)
      }
    }
  }, [query])

      useEffect(()=>{
        // fetch products when selected changes or query changes
        if(selected == null) return
        let cancelled = false
        async function loadProducts(){
      setLoadingProds(true)
        try{
        const qs = new URLSearchParams()
        qs.set('page', '1')
        qs.set('limit', '12')
        // only set category param for real categories (not the virtual search tab)
        if(selected && String(selected) !== SEARCH_CATEGORY_ID) qs.set('category', String(selected))
        if(query) qs.set('search', query)
        const path = '/api/productos' + (qs.toString() ? `?${qs.toString()}` : '')
        const res = await api.get(path)
        // expected shape: { page, limit, total, totalPages, products }
            const arr = res && res.products ? res.products : (Array.isArray(res) ? res : [])
            // dedupe by id or name to avoid duplicates from backend
            const seen = new Set()
            const unique = arr.filter(item=>{
              const id = item.id || item.id_producto || item.idProduct || item.nombre || item.name
              if(!id) return true
              if(seen.has(String(id))) return false
              seen.add(String(id))
              return true
            })
            if(!cancelled){
              setProducts(unique)
              setProductsError(null)
            }
      }catch(e){
        console.error('failed to load products', e)
        if(!cancelled){
          setProducts([])
          const msg = e && e.message ? e.message : 'Error cargando productos'
          const status = e && e.status ? e.status : null
          setProductsError({ message: msg, status })
        }
      }finally{
        if(!cancelled) setLoadingProds(false)
      }
    }
    loadProducts()
    return ()=>{ cancelled = true }
  }, [selected, query])

  // debounce handling: update searchTerm immediately, set `query` after 400ms or on Enter
  function onSearchChange(e){
    const v = e.target.value
    setSearchTerm(v)
    if(debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(()=>{
      setQuery(v)
    }, 400)
  }

  function onSearchKeyDown(e){
    if(e.key === 'Enter'){
      e.preventDefault()
      if(debounceRef.current) clearTimeout(debounceRef.current)
      setQuery(searchTerm)
    }
  }

  function priceOf(p){
    return Number(p.precio ?? p.price ?? p.precio_unitario ?? 0)
  }

  return (
    
    <div className="space-y-6">
      
      <PendingOrderCard />
      
      {/* HERO con fondo y overlay */}
      <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] relative bg-cover bg-center rounded-2xl overflow-hidden"
        style={{ backgroundImage: "url('/images/IMG_6990.JPG')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 px-4 py-5 flex flex-col justify-center items-center text-white">
          <img src="/logo.svg" onError={e=>e.currentTarget.remove()} alt="logo" className="h-7 mb-2 opacity-90" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center">¿Qué se te antoja hoy?</h2>
          <div className="mt-4 w-full max-w-md">
            <div className="flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow">
              <span className="opacity-60">🔎</span>
              <input
                className="flex-1 outline-none text-ink-900 placeholder:text-ink-500 bg-transparent"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={onSearchChange}
                onKeyDown={onSearchKeyDown}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-1">
        <MesaBanner />
      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl p-3 shadow-card">
        <div className="flex gap-2 px-1 overflow-x-auto">
          {loadingCats ? (
            <div className="px-2 py-1 text-sm text-ink-500">Cargando categorías...</div>
          ) : (
            // If there's an active search query, add a virtual 'Búsqueda' category at the start
            (()=>{
              const display = []
              if(query){
                display.push({ id: SEARCH_CATEGORY_ID, nombre: 'Búsqueda' })
              }
              for(const cat of categories) display.push(cat)
              return display.map(cat => {
                const id = cat.id_categoria ?? cat.id ?? cat.id
                const active = String(id) === String(selected)
                return (
                  <button key={id}
                    onClick={()=>setSelected(id)}
                    className={`${active ? 'border-b-2 border-brand-600 pb-1 font-semibold text-brand-600' : 'text-ink-500'} px-3 py-1`}
                  >{cat.nombre || cat.name}
                  </button>
                )
              })
            })()
          )}
        </div>

        {/* Productos: carrusel y grid */}
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink-900">Productos</h3>
            <span className="text-ink-500">›</span>
          </div>
          <p className="text-xs text-ink-500 -mt-1">Selecciona una categoría para ver los productos</p>

          {loadingProds ? (
            <div className="text-ink-500">Cargando productos...</div>
          ) : productsError ? (
            <div className="text-ink-500">
              {productsError.status === 401 ? (
                <div>
                  <div>Necesitas iniciar sesión para ver los productos.</div>
                  <button onClick={()=>navigate('/login')} className="mt-2 px-3 py-1 rounded bg-brand-600 text-white">Ir a Login</button>
                </div>
              ) : (
                <div>{productsError.message || 'Error al cargar productos'}</div>
              )}
            </div>
          ) : products.length === 0 ? (
            <div className="text-ink-500">No hay productos</div>
          ) : null
          }

          {/* Grid larger view */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
            {products.map(p=>{
              const id = p.id || p.id_producto || p.idProduct || (p.nombre||p.name)
              const img = p.imagen_url || p.image || p.img || '/images/burger.jpg'
              const precio = priceOf(p)
              return (
                <div key={id} className="rounded-2xl bg-white shadow p-2">
  <Link to={`/product/${id}`} className="block">
    <div className="w-full rounded-xl mb-2 overflow-hidden relative" style={{ paddingTop: '100%' }}>
      <div
        className="absolute inset-0 bg-gray-200 bg-cover bg-center"
        style={{ backgroundImage:`url('${img}')` }}
      />
    </div>
    <div className="text-sm h-6 overflow-hidden">{p.nombre || p.name}</div>
    <div className="text-xs text-ink-500">${precio.toLocaleString('es-CO')}</div>
  </Link>

  <button 
    onClick={()=>{ addItem(p,1); setJustAdded(id); setTimeout(()=>setJustAdded(null),1500) }}
    className="mt-3 w-full rounded-lg bg-brand-600 text-white py-2 flex items-center justify-center"
  >
    {justAdded === id ? 'Agregado' : 'Agregar'}
  </button>
</div>


              )
            })}
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
    // end Home.jsx

