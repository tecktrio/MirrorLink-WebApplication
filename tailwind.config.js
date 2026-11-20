/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#2A1810',
        brown: {
          50: '#FDFBF7',
          100: '#F7F2EB',
          200: '#EFE5D8',
          300: '#DFCDB8',
          400: '#BC9B7B',
          500: '#8C6747',
          600: '#6B4C33',
          700: '#4E3624',
          800: '#382619',
          900: '#2A1810',
          950: '#1D100A',
        },
      },
      fontFamily: {
        sans: ['"Uber Move Text"', '"Uber Move"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Uber Move"', '"Uber Move Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}