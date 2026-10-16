/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fcfaf2',
          100: '#f7f1dc',
          200: '#efe2b5',
          300: '#e4ce87',
          400: '#d9b859',
          500: '#d4af37',
          600: '#b89127',
          700: '#936f20',
          800: '#77571f',
          900: '#63481e',
        },
        forest: {
          950: '#03140f',
          900: '#07241c',
          850: '#0b2e24',
          800: '#0f3a2e',
          700: '#155241',
          600: '#1b6b55',
          500: '#26876c',
          400: '#34a585',
        },
        cream: {
          50: '#ffffff',
          100: '#fdfbf7',
          200: '#faf7f2',
          300: '#f4efe6',
          400: '#e9dfd0',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

