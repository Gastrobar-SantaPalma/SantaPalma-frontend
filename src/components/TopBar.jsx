export default function TopBar() {
  return (
    <header className="h-14 px-4 flex items-center justify-between bg-white shadow-sm">
      <button aria-label="menu" className="text-2xl text-ink-900">☰</button>
      <img src="/logo.svg" alt="Santa Palma" className="h-6" onError={(e)=>{e.currentTarget.remove()}}/>
      <button aria-label="cart" className="text-2xl">🛒</button>
    </header>
  );
}
