/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'mesh': 'mesh 8s ease infinite',
        'text-shimmer': 'text-shimmer 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(1deg)' },
          '100%': { transform: 'translateY(0px) rotate(0deg)' },
        },
        mesh: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'text-shimmer': {
          to: { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
