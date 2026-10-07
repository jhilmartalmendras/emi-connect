/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad visual EMI Connect: azul institucional + dorado academico
        emi: {
          50: '#eef4fb',
          100: '#d7e5f5',
          200: '#b0cbea',
          300: '#7ea9db',
          400: '#4b82c7',
          500: '#2a63ab',
          600: '#1d4d8c',
          700: '#163d70',
          800: '#102c52',
          900: '#0b2039',
          950: '#071426',
        },
        dorado: {
          50: '#fdf9ec',
          100: '#f9efc9',
          200: '#f3dd93',
          300: '#ecc95d',
          400: '#e3b435',
          500: '#d4a017',
          600: '#b57f10',
          700: '#8f5f10',
          800: '#764b14',
          900: '#653f16',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        suave: '0 1px 2px rgba(11, 32, 57, 0.06), 0 4px 12px rgba(11, 32, 57, 0.06)',
        tarjeta: '0 1px 3px rgba(11, 32, 57, 0.08), 0 8px 24px -8px rgba(11, 32, 57, 0.16)',
      },
      keyframes: {
        aparecer: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        deslizar: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulsoSuave: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        aparecer: 'aparecer 0.25s ease-out',
        deslizar: 'deslizar 0.25s ease-out',
        pulsoSuave: 'pulsoSuave 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
