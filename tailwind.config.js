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
        page: '#F5F5F0',
        surface: '#FFFFFF',
        'user-bubble': '#DDD9CE',
        'text-primary': '#1A1A18',
        'text-muted': '#6B6A68',
        'text-placeholder': '#9A9893',
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
          lighter: '#EFF6FF',
        },
        success: { DEFAULT: '#059669', light: '#ECFDF5' },
        warning: { DEFAULT: '#D97706', light: '#FFFBEB' },
        danger: { DEFAULT: '#DC2626', light: '#FEF2F2' },
        dark: {
          page: '#2B2A27',
          surface: '#1F1E1B',
          'surface-hover': '#333330',
          text: '#EEEEEE',
          'text-muted': '#9A9893',
        },
      },
      fontFamily: {
        display: ['Georgia'],
        ui: ['System'],
        mono: ['SF Mono', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        button: '12px',
        input: '12px',
        modal: '16px',
      },
      boxShadow: {
        card: '0 0.25rem 1.25rem rgba(0, 0, 0, 0.035)',
      },
      transitionTimingFunction: {
        claude: 'cubic-bezier(0.165, 0.85, 0.45, 1)',
      },
      transitionDuration: {
        claude: '300ms',
      },
    },
  },
  plugins: [],
};
