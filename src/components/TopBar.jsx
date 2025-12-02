import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useState } from 'react'
import { FaCog, FaSpinner } from 'react-icons/fa' // Spinner e icono de configuración
import { FaInstagram } from 'react-icons/fa'


export default function TopBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)

  function openConfirm() { setConfirmOpen(true) }
  function closeConfirm() { setConfirmOpen(false) }

  function confirmLogout() {
    logout()
    setConfirmOpen(false)
    navigate('/login')
  }

  function navigateTo(path) {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <>
      <header className="h-14 px-4 flex items-center justify-between bg-white shadow-sm">

        {/* IZQUIERDA: botón menú */}
        <div className="w-8 flex items-center"><button aria-label="menu" className="text-2xl text-ink-900" onClick={() => setMenuOpen(true)} >☰</button>
        </div>
        {/* CENTRO: logo centrado */}
        <div className="flex-1 flex justify-center">
          <img
            src="/images/logonegro.png"
            alt="Santa Palma"
            className="h-16 object-contain"
            onError={(e) => e.currentTarget.remove()}
          />
        </div>

        {/* DERECHA: espacio vacío del mismo ancho para centrar */}
        <div className="w-8"></div>

      </header>


      {/* Confirmación de cierre de sesión */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirm} />
          <div role="dialog" aria-modal="true" className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-4">
            <h3 className="text-lg font-semibold">Confirmar cierre de sesión</h3>
            <p className="text-sm text-ink-600 mt-2">¿Estás seguro que deseas cerrar la sesión? Se cerrará tu sesión actual.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={closeConfirm} className="px-4 py-2 rounded-full bg-brand-100 text-ink-900">Cancelar</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white">Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Menú lateral */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          {/* Contenedor del menú */}
          <div className="relative bg-white w-64 h-full shadow-lg z-50 p-6 flex flex-col justify-between animate-slideIn">
            <div>
              <button onClick={() => setMenuOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl">✕</button>
              <div className="flex items-center gap-2 mb-6">
                <img src="/images/icon-favicon.png" alt="Santa Palma" className="h-68 " />
                
              </div>

              <ul className="space-y-4">
                <li>
                  <button onClick={() => navigateTo('./Home')} className="text-gray-700 hover:text-green-600">Inicio</button>
                </li>
                <li>
                  <button onClick={() => navigateTo('/account')} className="text-gray-700 hover:text-green-600">Perfil</button>
                </li>
                <li>
                  <button onClick={() => navigateTo('/orders')} className="text-gray-700 hover:text-green-600">Reservas</button>
                </li>
                <li>
                  <button onClick={() => setAboutOpen(true)} className="text-gray-700 hover:text-green-600">Sobre nosotros</button>
                </li>
                <li>
                  <button onClick={() => setFaqOpen('/preguntas-frecuentes')} className="text-gray-700 hover:text-green-600">Preguntas frecuentes</button>
                </li>
                <li>
                  <button onClick={openConfirm} className="text-red-600 hover:text-red-700 font-semibold">Cerrar sesión</button>
                </li>

              </ul>
            </div>

            {/* Configuración en la parte inferior */}
            <div className="absolute bottom-12 left-6 flex items-center gap-2 text-gray-600 cursor-pointer hover:text-black" onClick={() => navigateTo('/account')}>
              <FaCog />
              <span>Configuración</span>
            </div>

          </div>
        </div>
      )}
      {/* Modal Sobre Nosotros con scroll y animación */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fondo semi-transparente */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setAboutOpen(false)} />

          {/* Contenedor del modal */}
          <div className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md max-h-[80vh] p-6 overflow-y-auto transform transition-transform duration-300 scale-95 opacity-0 animate-modalIn">
            <h2 className="text-xl font-bold mb-2">Sobre Nosotros</h2>
            <p className="text-gray-700 mb-2">
              Somos Santa Palma, una plataforma dedicada a mejorar tu experiencia de pedidos y reservas.
            </p>
            <p className="text-gray-700 mb-2">
              Nuestro objetivo es brindarte comodidad, rapidez y seguridad en cada interacción.
            </p>
            <p className="text-gray-700 mb-2">
              Que esperas para comprar, parchate y disfruta !
            </p>
            <p className="text-gray-700 mb-2 inline-flex items-center gap-1">
              Siguenos en Instagram: <FaInstagram className="text-pink-500" /> @santapalma
            </p>
            <button onClick={() => setAboutOpen(false)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
              Cerrar
            </button>
          </div>
        </div>
      )}
      {faqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fondo semi-transparente */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setFaqOpen(false)} />

          {/* Contenedor del modal */}
          <div className="relative bg-white rounded-2xl shadow-lg w-[90%] max-w-md max-h-[80vh] p-6 overflow-y-auto transform transition-transform duration-300 scale-95 opacity-0 animate-modalIn">
            <h2 className="text-xl font-bold mb-3">Preguntas Frecuentes</h2>

            <div className="space-y-3 text-gray-700">

              <div>
                <p className="font-semibold">📦 ¿Cómo realizo un pedido?</p>
                <p>Solo ingresa, selecciona tus productos y confirma tu compra desde la plataforma.</p>
              </div>

              <div>
                <p className="font-semibold">⏱️ ¿Cuánto tarda una reserva?</p>
                <p>El tiempo depende del local o servicio, pero siempre te notificaremos.</p>
              </div>

              <div>
                <p className="font-semibold">🔒 📌 ¿Por qué combinamos cannabis y licor?</p>
                <p>Parce, porque aquí venimos a relajarnos sin estrés.
                  La mezcla es pensada para que vivas un parche suave, chill, sin exager con medidas moderadas y responsables.</p>
              </div>

              <div>
                <p className="font-semibold">📌 ¿Es seguro consumir nuestros productos?</p>
                <p>Claro que sí, mi rey / mi reina.
                  Todo lo hacemos con medidas exactas, ingredientes de calidad y personal capacitado.
                  Cuidamos cada preparación para que tengas una experiencia tranquila y sin sustos.</p>
              </div>

              <div>
                <p className="font-semibold">💳 ¿Qué métodos de pago aceptan?</p>
                <p>Transferencias, efectivo, Wompi,Addi,Sistecredito,Especie,Lavando Platos, Con Weed.</p>
              </div>

            </div>

            <button onClick={() => setFaqOpen(false)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
              Cerrar
            </button>
          </div>
        </div>
      )}




      {/* Tailwind CSS Animación */}
      <style>{`
        @keyframes modalIn {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modalIn {
          animation: modalIn 0.25s forwards;
        }
      `}</style>

    </>
  )
}
