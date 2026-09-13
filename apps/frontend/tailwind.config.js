/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marca: {
          50: "#eefaf9",
          100: "#d3f1ee",
          400: "#1a9a97",
          500: "#0d7377",
          600: "#0a5c60",
          700: "#08484b",
        },
      },
    },
  },
  plugins: [],
};
