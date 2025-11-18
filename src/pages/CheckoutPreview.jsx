export default function CheckoutPreview() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pago pendiente</h1>

      <p className="text-gray-600 mb-6">
        Este es un resumen preliminar antes de ir a la pasarela de pago.
      </p>

      {/* Aquí luego mostraremos los productos por cobrar */}

      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Ir a pagar
      </button>
    </div>
  );
}
