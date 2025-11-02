import React, { createContext, useContext, useEffect, useReducer } from 'react'

const STORAGE_KEY = 'cart'

function readStorage(){
  try{
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return raw ? JSON.parse(raw) : { items: [] }
  }catch(e){
    return { items: [] }
  }
}

function writeStorage(state){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }catch(e){
    // ignore
  }
}

function keyOf(product){
  // prefer explicit id fields used by backend
  return product.id || product.id_producto || product.idProduct || product.sku || null
}

function reducer(state, action){
  switch(action.type){
    case 'hydrate':
      return action.payload
    case 'add': {
      const { product, quantity = 1 } = action.payload
      const k = keyOf(product)
      const existingIndex = state.items.findIndex(i => (k ? i.id === k : false))
      if(existingIndex >= 0){
        const items = [...state.items]
        items[existingIndex] = { ...items[existingIndex], cantidad: items[existingIndex].cantidad + quantity }
        return { ...state, items }
      }
      const id = k || Date.now().toString()
      const item = { id, product, cantidad: quantity }
      return { ...state, items: [...state.items, item] }
    }
    case 'remove': {
      const id = action.payload.id
      return { ...state, items: state.items.filter(i => i.id !== id) }
    }
    case 'update': {
      const { id, cantidad } = action.payload
      const items = state.items.map(i => i.id === id ? { ...i, cantidad } : i)
      return { ...state, items }
    }
    case 'clear':
      return { items: [] }
    default:
      return state
  }
}

const CartContext = createContext(null)

export function CartProvider({ children }){
  const [state, dispatch] = useReducer(reducer, { items: [] })

  useEffect(()=>{
    const stored = readStorage()
    dispatch({ type: 'hydrate', payload: stored })
  }, [])

  useEffect(()=>{
    writeStorage(state)
  }, [state])

  const addItem = (product, quantity = 1) => dispatch({ type: 'add', payload: { product, quantity } })
  const removeItem = (id) => dispatch({ type: 'remove', payload: { id } })
  const updateQuantity = (id, cantidad) => dispatch({ type: 'update', payload: { id, cantidad } })
  const clearCart = () => dispatch({ type: 'clear' })

  const getTotal = ()=>{
    return state.items.reduce((acc, it)=>{
      const price = (it.product && (it.product.precio || it.product.price)) || 0
      const qty = it.cantidad || 0
      return acc + (Number(price) * Number(qty))
    }, 0)
  }

  const value = { cart: state, addItem, removeItem, updateQuantity, clearCart, getTotal }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(){
  const ctx = useContext(CartContext)
  if(!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export default CartProvider
