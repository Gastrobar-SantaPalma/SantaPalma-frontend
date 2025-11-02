// Lightweight compatibility shim to re-export the real implementation in cart.jsx
// This file avoids having JSX inside a .js file which breaks Vite import analysis.
export { default } from './cart.jsx'
export * from './cart.jsx'
