import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FAF8F2",
          100: "#F5F0E5",
          200: "#ECE3D0",
          300: "#DFCDB0",
          bg: "#FAF8F5",
          card: "#FFFFFF",
          border: "#E7E2D6",
        },
        navy: {
          50: "#EEF3F8",
          100: "#D6E3EF",
          200: "#ADC7DE",
          300: "#7CA5C9",
          500: "#1E3A8A",
          700: "#132D54",
          800: "#0F2444",
          900: "#0A172B",
          accent: "#122A4E",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
