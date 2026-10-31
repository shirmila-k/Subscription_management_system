/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        plum: {
          50: '#FBF7FC',
          100: '#F3EAF5', // Light plum
          200: '#E5D1E8',
          300: '#D1ACD7',
          400: '#B67EBF',
          500: '#84418A', // Secondary plum
          600: '#6D286F', // Primary plum
          700: '#581F5A',
          800: '#421747', // Dark plum
          900: '#2E0F32',
          950: '#1C081F',
        },
        surface: {
          page: '#FAF9FB',
          card: '#FFFFFF',
        },
        ink: {
          primary: '#27212B',
          secondary: '#817986',
          muted: '#A59EAA',
        },
        line: {
          DEFAULT: '#EAE5EC',
          subtle: '#F0ECF2',
        },
        state: {
          success: '#16845B',
          'success-bg': '#E8F5EE',
          warning: '#B7791F',
          'warning-bg': '#FEF7EC',
          error: '#C53B4B',
          'error-bg': '#FDF0F2',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(39, 33, 43, 0.04), 0 1px 2px 0 rgba(39, 33, 43, 0.02)',
        cardHover: '0 4px 12px 0 rgba(66, 23, 71, 0.08), 0 2px 4px 0 rgba(66, 23, 71, 0.04)',
        dropdown: '0 10px 25px -5px rgba(66, 23, 71, 0.1), 0 8px 10px -6px rgba(66, 23, 71, 0.05)',
      },
    },
  },
  plugins: [],
};
