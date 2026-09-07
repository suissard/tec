/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./sections/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E30613',
          redHover: '#BF000B',
          redLight: '#FF3847',
          dark: '#0B0B0E',
          cardBg: '#141419',
          cardBorder: '#262630',
          accent: '#1D1D26',
          discord: '#5865F2',
          discordHover: '#4752C4'
        }
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
