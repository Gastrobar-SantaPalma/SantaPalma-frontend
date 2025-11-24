import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useCart } from "../store/cart";

const StarDisplay = ({ value, count }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-yellow-400 text-xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-ink-500 font-medium">
        {Number(value).toFixed(1)} ({count} opiniones)
      </span>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Cargar producto
        const resProduct = await api.get(`/api/productos/${id}`, { noAuth: true });
        setProduct(resProduct);
        
        // Usar el promedio que viene directamente en el producto
        const avgRating = Number(resProduct.promedio_calificacion || resProduct.average_rating || 0);

        // Cargar comentarios
        try {
          const resComments = await api.get(`/api/productos/${id}/comentarios`, { noAuth: true });
          if (resComments) {
            setComments(resComments.comentarios || resComments.comments || []);
            setStats({
              average: avgRating, // Usamos el valor del producto
              count: Number(resComments.total || resComments.count || 0)
            });
          }
        } catch (err) {
          console.warn("No se pudieron cargar comentarios", err);
          // Si fallan los comentarios, al menos mostramos el promedio del producto
          setStats(prev => ({ ...prev, average: avgRating }));
        }

      } catch (e) {
        console.error("Error cargando detalle:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="p-6 text-ink-500">Cargando...</div>;
  if (!product) return <div className="p-6 text-ink-500">Producto no encontrado</div>;

  const name = product.nombre || product.name;
  const img = product.imagen_url || product.image || "/images/burger.jpg";
  const price = Number(product.precio ?? product.price ?? 0);
  const description = product.descripcion || product.description || "Sin descripción disponible.";

  return (
    <div className="p-4 space-y-4">

      {/* Botón atrás */}
      <button
        onClick={() => navigate(-1)}
        className="text-brand-600 text-sm"
      >
        ← Volver
      </button>

      {/* Imagen grande */}
      <div className="w-full rounded-2xl overflow-hidden relative" style={{ paddingTop: "100%" }}>
        <div
          className="absolute inset-0 bg-gray-200 bg-cover bg-center"
          style={{ backgroundImage: `url('${img}')` }}
        />
      </div>

      {/* Info del producto */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">
        <h1 className="text-xl font-semibold text-ink-900">{name}</h1>

        <StarDisplay value={stats.average} count={stats.count} />

        <div className="text-brand-600 text-lg font-bold">
          ${price.toLocaleString("es-CO")}
        </div>

        <p className="text-sm text-ink-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Botón agregar */}
      <button
        onClick={() => addItem(product, 1)}
        className="w-full py-3 bg-brand-600 text-white rounded-xl text-center text-lg"
      >
        Agregar al carrito
      </button>

      {/* Sección de Comentarios */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-ink-900 mb-4">Opiniones de clientes</h3>
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl text-ink-500">
            <p>Aún no hay calificaciones.</p>
            <p className="text-sm mt-1">¡Sé el primero en probarlo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((c, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-ink-900">{c.usuario || c.nombre_usuario || 'Anónimo'}</span>
                  <div className="flex text-yellow-400 text-sm">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s}>{s <= (c.puntuacion || c.calificacion || c.rating) ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
                {c.comentario && (
                  <p className="text-sm text-ink-600 leading-relaxed">{c.comentario}</p>
                )}
                <div className="mt-2 text-xs text-ink-400">
                  {new Date(c.fecha || c.created_at || Date.now()).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
