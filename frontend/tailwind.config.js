/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#00d4a4',
          deep: '#00b48a',
          soft: '#7cebcb',
          light: '#e6faf5',
        },
        ink: '#0a0a0a',
        charcoal: '#1c1c1e',
        slate: '#3a3a3c',
        steel: '#5a5a5c',
        stone: '#888888',
        muted: '#a8a8aa',
        surface: {
          DEFAULT: '#f7f7f7',
          soft: '#fafafa',
          code: '#1c1c1e',
        },
        hairline: {
          DEFAULT: '#e5e5e5',
          soft: '#ededed',
          dark: '#1f1f1f',
        },
        brand: {
          tag: '#3772cf',
          warn: '#c37d0d',
          annotate: '#1ba673',
          error: '#d45656',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'pill': '9999px',
      },
      boxShadow: {
        'mint-glow': '0 4px 16px rgba(0, 212, 164, 0.25)',
        'card-subtle': '0 1px 3px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
