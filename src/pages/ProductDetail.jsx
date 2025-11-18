import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useCart } from "../store/cart";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await api.get(`/api/productos/${id}`, { noAuth: true });
        setProduct(res);
      } catch (e) {
        console.error("Error cargando detalle:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
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

      <div className="h-10" />
    </div>
  );
}
