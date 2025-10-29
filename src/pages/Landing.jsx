import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <section
      className="h-screen relative text-white"
      style={{backgroundImage:"url('/images/IMG_6993.JPG')", backgroundSize:"cover", backgroundPosition:"center"}}
    >
       {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/70" />
      
       {/* Contenido */}
      <div className="relative h-full grid place-items-center">
        <div className="text-center space-y-4">


          <div className="relative h-full grid place-items-center pt-6"></div>

           {/* Logo */}
          <img src="/images/icons/Recurso_22.png" className="mx-auto mt-[-20px] mb-4 w-20 sm:w-28 md:w-32 lg:w-40 h-auto object-contain" />



           {/* Título */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
  Santa Palma
</h1>


           {/* Botón Log in */}
          <Link className="inline-block rounded-full px-4 sm:px-6 py-2 sm:py-3 bg-white text-ink-900 font-semibold" to="/login">
  Log in
</Link>


          {/* Texto de registro */}
          <p className="text-sm">
            ¿No tienes cuenta? <span className="text-brand-300 underline">Regístrate</span>
          </p>

        </div>
      </div>
    </section>
  );
}
