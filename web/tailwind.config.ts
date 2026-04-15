import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#03070f',
        ink:     '#060d1a',
        surface: {
          DEFAULT: '#0a1221',
          2:       '#0f1a2e',
          3:       '#162036',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          soft:    'rgba(255,255,255,0.04)',
          bright:  'rgba(255,255,255,0.12)',
        },
        emerald: {
          DEFAULT: '#10b981',
          dim:     'rgba(16,185,129,0.12)',
          glow:    'rgba(16,185,129,0.25)',
        },
        ruby: {
          DEFAULT: '#ef4444',
          dim:     'rgba(239,68,68,0.12)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          dim:     'rgba(245,158,11,0.10)',
        },
        sapphire: {
          DEFAULT: '#3b82f6',
          dim:     'rgba(59,130,246,0.10)',
          glow:    'rgba(59,130,246,0.30)',
        },
        mist:    '#94a3b8',
        fog:     '#64748b',
        smoke:   '#334155',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', '-apple-system', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm:  '6px',
        md:  '12px',
        lg:  '16px',
        xl:  '22px',
        '2xl': '28px',
      },
      boxShadow: {
        card:          '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        elevated:      '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        'glow-green':  '0 0 24px rgba(16,185,129,0.2), 0 0 48px rgba(16,185,129,0.08)',
        'glow-red':    '0 0 24px rgba(239,68,68,0.2)',
        'glow-blue':   '0 0 24px rgba(59,130,246,0.25)',
        'glow-sm':     '0 0 12px rgba(59,130,246,0.15)',
        inner:         'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(1.2)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.45s ease-out forwards',
        'fade-in':   'fade-in 0.3s ease-out forwards',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        shimmer:     'shimmer 1.8s infinite',
        'slide-in':  'slide-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
