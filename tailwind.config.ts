import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Apple-style de RoomUNAP
        ink: {
          DEFAULT: "#1D1D1F",      // texto principal
          soft: "#424245",          // texto secundario
          muted: "#86868B",         // texto terciario
        },
        surface: {
          DEFAULT: "#FFFFFF",       // fondo principal
          alt: "#F5F5F7",           // fondo alterno (gris Apple)
          elevated: "#FBFBFD",      // tarjetas elevadas
        },
        line: "#D2D2D7",            // bordes
        accent: {
          DEFAULT: "#0071E3",       // azul Apple
          hover: "#0077ED",
          light: "#E8F1FB",
        },
        success: "#34C759",
        warning: "#FF9500",
        danger: "#FF3B30",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Helvetica Neue'",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        "apple-sm": "10px",
        "apple": "14px",
        "apple-lg": "18px",
        "apple-xl": "22px",
        "apple-pill": "980px",
      },
      boxShadow: {
        "apple-sm": "0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)",
        "apple": "0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "apple-lg": "0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        "apple-hover": "0 16px 40px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;