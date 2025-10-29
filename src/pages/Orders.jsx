import SemiProgress from "../components/SemiProgress.jsx";

export default function Orders() {
  return (
    <div className="space-y-5 text-ink-900">
      <h2 className="text-2xl font-semibold">Actividad reciente</h2>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-4">
          <SemiProgress value={73} />
          <div className="flex-1">
            <p className="text-sm text-ink-700">
              ¡Ya casi entregamos tu pedido!<br/>
              <span className="text-ink-500">Tiempo transcurrido: 12:06 minutos</span>
            </p>
            <button className="mt-3 rounded-full bg-brand-500 text-white px-5 py-2 font-semibold">
              Detalles
            </button>
          </div>
        </div>
      </section>

      <h3 className="text-xl font-semibold mt-4">Pedidos</h3>
      <p className="text-xs text-ink-500 -mt-1">Solicitudes en curso</p>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <img src="/icons/burger.png" className="w-8 h-8" />
          <div className="flex-1">
            <div className="font-semibold">Comidas · 6 Productos <span className="text-ink-500">›</span></div>
            <div className="text-sm text-ink-700 truncate">Hamburguesa Diabla…</div>
            <div className="text-xs text-ink-500">$109.000 · 19 de oct., 10:57 pm</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-ink-500">Preparación</div>
      </section>

      <h3 className="text-xl font-semibold mt-2">Historial</h3>
      <p className="text-xs text-ink-500 -mt-1">Sabores exquisitos en porciones justas</p>

      <section className="bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-3">
          <img src="/icons/drink.png" className="w-8 h-8" />
          <div className="flex-1">
            <div className="font-semibold">Licores · 2 Productos <span className="text-ink-500">›</span></div>
            <div className="text-sm text-ink-700">Margarita + Mojito</div>
            <div className="text-xs text-ink-500">$52.000 · 20 de oct., 08:16 pm</div>
          </div>
          <button className="text-xs bg-brand-100 text-ink-900 px-3 py-1 rounded-full">Pedir de nuevo</button>
        </div>
        <div className="mt-2 text-xs text-ink-500">Completado</div>
      </section>

      <div className="h-10" />
    </div>
  );
}
