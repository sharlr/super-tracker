/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2490EF',
        secondary: '#D1D8DD',
        background: '#F0F3F5',
      },
    },
  },
  plugins: [],
}
