/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        textMain: '#f8fafc',
        textMuted: '#94a3b8',
        sender: {
          user: '#3b82f6', // blue
          bot: '#10b981', // emerald
          agent: '#8b5cf6', // violet
          pending_human: '#f59e0b' // amber
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
