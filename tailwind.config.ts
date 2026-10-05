import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        primary: "var(--primary)",
        primaryDark: "var(--primaryDark)",
        accent: "var(--accent)",
        text: "var(--text)",
        textSecondary: "var(--textSecondary)",
        border: "var(--border)",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        navy: {
          800: "#232326",
          900: "#161617",
          950: "#141518",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "glow-gold": "0 0 20px var(--glow)",
        "glow-gold-lg": "0 0 40px var(--glow)",
        "glow-theme": "0 0 24px var(--glow)",
      },
    },
  },
  plugins: [],
}
export default config
