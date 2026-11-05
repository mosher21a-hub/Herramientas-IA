/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fafaf7',
        surface: '#ffffff',
        ink: '#1a1916',
        soft: '#6b6964',
        hairline: '#e8e5df',
        terracotta: {
          DEFAULT: '#c96442',
          dark: '#a8503a',
          soft: 'rgba(201, 100, 66, 0.14)',
        },
        night: {
          bg: '#161513',
          surface: '#1e1d1a',
          fg: '#ece8e0',
          muted: '#a8a398',
          line: '#35332d',
          accent: '#d47a56',
        },
      },
      fontFamily: {
        display: ['"Iowan Old Style"', 'Charter', 'Georgia', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      maxWidth: {
        page: '72rem',
      },
    },
  },
  plugins: [],
}
