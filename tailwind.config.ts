import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B132B", 50: "#EEF1F8", 100: "#D6DCEB", 200: "#A9B4D2", 300: "#7886B1", 400: "#4A5A8C", 500: "#2C3A66", 600: "#1C2850", 700: "#141E3E", 800: "#0F1834", 900: "#0B132B", 950: "#070D1F" },
        brand: { DEFAULT: "#2563EB", 50: "#EFF5FF", 100: "#DBE7FE", 200: "#BFD4FE", 300: "#93B6FD", 400: "#608EFA", 500: "#3B6FF6", 600: "#2563EB", 700: "#1D4ED8", 800: "#1E40AF", 900: "#1E3A8A" },
        teal: { DEFAULT: "#00B8A9", 50: "#E6FAF8", 100: "#C2F2EE", 200: "#8AE6DE", 300: "#4DD6CA", 400: "#1AC6B7", 500: "#00B8A9", 600: "#009488", 700: "#00756C", 800: "#035C55", 900: "#064B46" },
        surface: "#F8FAFC",
        danger: "#EF4444",
        success: "#10B981",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,19,43,0.04), 0 4px 16px -4px rgba(11,19,43,0.06)",
        lift: "0 10px 40px -12px rgba(11,19,43,0.25)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        pulseline: { "0%": { strokeDashoffset: "600" }, "100%": { strokeDashoffset: "0" } },
        breathe: { "0%,100%": { transform: "scaleY(1)" }, "50%": { transform: "scaleY(1.012)" } },
      },
      animation: {
        "fade-in": "fade-in .35s ease-out both",
        pulseline: "pulseline 2.4s linear infinite",
        breathe: "breathe 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
