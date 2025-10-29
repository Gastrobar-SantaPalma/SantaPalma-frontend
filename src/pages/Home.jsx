const products = [
  { id:1, name:"Bruschetas", price:18000, img:"/images/bruschettas.jpg" },
  { id:2, name:"Burger Santa", price:24000, img:"/images/burger.jpg" },
  { id:3, name:"Limonada", price:9000, img:"/images/bruschettas.jpg" },
  { id:4, name:"Nachos", price:12000, img:"/images/burger.jpg" },
];

export default function Home() {
  return (
    <div className="space-y-6">
      {/* HERO con fondo y overlay */}
  <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[28rem] relative bg-cover bg-center rounded-2xl overflow-hidden"

    style={{ backgroundImage: "url('/images/IMG_6990.JPG')" }}
  >
     {/* Overlay oscuro */}
    <div className="absolute inset-0 bg-black/50" />

    {/* Contenido encima del fondo */}
    <div className="absolute inset-0 px-4 py-5 flex flex-col justify-center items-center text-white">
      {/* Logo opcional */}
      <img
        src="/logo.svg"
        onError={e => e.currentTarget.remove()}
        alt="logo"
        className="h-7 mb-2 opacity-90"
      />
      {/* Título */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center">
        ¿Qué se te antoja hoy?
      </h2>

      {/* Barra de búsqueda */}
      <div className="mt-4 w-full max-w-md">
        <div className="flex items-center gap-2 bg-white/90 rounded-full px-4 py-2 shadow">
          <span className="opacity-60">🔎</span>
          <input
            className="flex-1 outline-none text-ink-900 placeholder:text-ink-500 bg-transparent"
            placeholder="Buscar..."
          />
          </div>
      </div>
    </div>
  </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl p-3 shadow-card">
        <div className="flex gap-6 px-1">
          <button className="border-b-2 border-brand-600 pb-1 font-semibold text-brand-600">Comidas</button>
          <button className="text-ink-500">Bebidas</button>
          <button className="text-ink-500">Licores</button>
        </div>

        {/* Sección: Entradas */}
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink-900">Entradas</h3>
            <span className="text-ink-500">›</span>
          </div>
          <p className="text-xs text-ink-500 -mt-1">Para picar mientras esperas</p>

          {/* Carrusel simple (scroll-x) */}
          <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
            {products.map(p=>(
              <div key={p.id} className="min-w-[140px] rounded-2xl bg-white shadow p-2">
                <div
                  className="h-24 rounded-xl bg-gray-200 mb-2 bg-cover bg-center"
                  style={{backgroundImage:`url('${p.img}')`}}
                />
                <div className="text-sm">{p.name}</div>
                <div className="text-xs text-ink-500">${p.price.toLocaleString("es-CO")}</div>
                <button className="mt-2 w-full rounded-lg bg-brand-600 text-white py-1 flex items-center justify-center gap-1">
                  <span>+</span> Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sección: Hamburguesas (rejilla) */}
        <div className="mt-6 px-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink-900">Hamburguesas</h3>
            <span className="text-ink-500">›</span>
          </div>
          <p className="text-xs text-ink-500 -mt-1">Sabores exquisitos en porciones justas</p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            {products.map(p=>(
              <div key={p.id} className="rounded-2xl bg-white shadow p-2">
                
                <div
                className="h-48 rounded-xl bg-gray-200 mb-2 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/burger.jpg')" }}
                />
                <div className="text-sm">{p.name}</div>
                <div className="text-xs text-ink-500">${p.price.toLocaleString("es-CO")}</div>
                <button className="mt-2 w-full rounded-lg bg-brand-600 text-white py-1">Agregar</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
