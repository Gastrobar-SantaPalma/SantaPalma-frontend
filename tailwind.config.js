export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // tonos oliva/mostaza que se ven en tus capturas
          50:  "#f7f8f2",
          100: "#eef0e2",
          200: "#dfe3c0",
          300: "#cbd097",
          400: "#b6bc6d",
          500: "#a4ab3f",   // botón "Detalles" + acentos
          600: "#8f952f",   // tabs activos / énfasis
          700: "#6f7423",
          800: "#4f5219",
          900: "#363810"
        },
        ink: {
          900: "#222222",   // títulos
          700: "#3a3a3a",   // textos
          500: "#6b7280"    // notas / subtítulos
        },
        sheet: {
          50:  "#f5f6f8",   // fondo de la app
          100: "#f0f1f4"    // tarjetas muy suaves
        }
      },
      boxShadow: {
        card: "0 6px 18px rgba(0,0,0,.08)"
      },
      borderRadius: {
        xl2: "1.2rem"
      }
    },
  },
  plugins: [],
};
