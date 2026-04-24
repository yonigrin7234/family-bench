/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F6F3',
          deep: '#EFEDE7',
          edge: '#E4E1D9',
        },
        ink: {
          DEFAULT: '#14181F',
          soft: '#2B323D',
          mute: 'rgba(20,24,31,0.58)',
          faint: 'rgba(20,24,31,0.34)',
        },
        ox: {
          DEFAULT: '#B44028',
          deep: '#842E1C',
          wash: '#F4E3DE',
        },
        forest: {
          DEFAULT: '#2F5A3A',
          wash: '#DEE8DD',
        },
        sand: {
          DEFAULT: '#C9B892',
          deep: '#8A7647',
          wash: '#F0EADA',
        },
        amber: {
          DEFAULT: '#A76A14',
          wash: '#F3E6CE',
        },
        urgent: {
          bg: '#0A0B0F',
          fg: '#FFFFFF',
          red: '#E5484D',
        },
      },
      borderColor: {
        rule: 'rgba(20,24,31,0.10)',
        ruleSoft: 'rgba(20,24,31,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '14px',
        xl: '18px',
        pill: '9999px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
      boxShadow: {
        soft1: '0 1px 2px rgba(20,24,31,0.04)',
        soft2: '0 4px 14px rgba(20,24,31,0.06), 0 1px 2px rgba(20,24,31,0.04)',
      },
    },
  },
  plugins: [],
};
