import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#dbe9ff',
          200: '#b7d2ff',
          300: '#8fb8ff',
          400: '#5f95ff',
          500: '#3874ff',
          600: '#2159db',
          700: '#1946ad',
          800: '#163e8d',
          900: '#122f6b'
        }
      }
    },
  },
  plugins: [forms],
};
export default config;
