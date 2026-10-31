/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          50: '#FBF0FF',
          100: '#F3EAF5',
          200: '#E996E5',
          300: '#D9A0D9',
          400: '#84418A',
          500: '#6D286F', // Primary Plum
          600: '#530D57',
          700: '#481D4D',
          800: '#421747', // Dark Plum Sidebar
          900: '#320738',
        },
        'primary-plum': '#6D286F',
        'dark-plum': '#421747',
        'secondary-plum': '#84418A',
        'light-plum': '#F3EAF5',
        'page-bg': '#FAF9FB',
        'surface-card': '#FFFFFF',
        'text-main': '#27212B',
        'text-muted': '#817986',
        'border-subtle': '#EAE5EC',
        'status-success': '#16845B',
        'status-success-bg': '#E8F5EE',
        'status-warning': '#B7791F',
        'status-warning-bg': '#FEF6E9',
        'status-error': '#C53B4B',
        'status-error-bg': '#FDF0F2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        button: '8px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(39, 33, 43, 0.04), 0 1px 2px -1px rgba(39, 33, 43, 0.02)',
        popover: '0 4px 6px -1px rgba(39, 33, 43, 0.06), 0 2px 4px -2px rgba(39, 33, 43, 0.04)',
        modal: '0 20px 25px -5px rgba(39, 33, 43, 0.08), 0 8px 10px -6px rgba(39, 33, 43, 0.04)',
      },
    },
  },
  plugins: [],
}
