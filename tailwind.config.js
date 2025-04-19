/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyberpunk': {
          'primary': '#00ff9d',
          'secondary': '#ff00ff',
          'accent': '#00ffff',
          'dark': '#0a0a0a',
          'darker': '#000000',
        },
      },
      fontFamily: {
        'cyber': ['Share Tech Mono', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 6s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 10px #00ff9d, 0 0 20px #00ff9d, 0 0 30px #00ff9d' },
          '100%': { textShadow: '0 0 20px #00ff9d, 0 0 30px #00ff9d, 0 0 40px #00ff9d' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
} 