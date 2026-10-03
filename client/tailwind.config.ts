import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090F",
        surface: "#0E1424",
        "surface-border": "rgba(255, 255, 255, 0.06)",
        saffron: {
          DEFAULT: "#FF9933",
          light: "#FFC24D",
          dark: "#D97706",
        },
        cyan: {
          live: "#22D3EE",
        },
        status: {
          success: "#34D399",
          warn: "#FBBF24",
          error: "#F87171",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
      },
      boxShadow: {
        "saffron-glow": "0 0 25px -5px rgba(255, 153, 51, 0.35)",
        "cyan-glow": "0 0 25px -5px rgba(34, 211, 238, 0.35)",
      },
      backgroundImage: {
        "saffron-gradient": "linear-gradient(135deg, #FF9933 0%, #FFC24D 100%)",
        "grid-pattern": "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
