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
        // Editorial design system
        bg:        '#F7F6F2',
        card:      '#FFFFFF',
        'row-alt': '#F9F8F4',

        // Text
        'text-primary':   '#111827',
        'text-secondary': '#6B7280',
        'text-muted':     '#9CA3AF',

        // Signal — editorial (deep, not neon)
        buy:   '#047857',
        hold:  '#92400E',
        sell:  '#991B1B',

        // Legacy aliases used in components
        paper:   '#F7F6F2',
        'paper-2': '#F0EFE9',
        'paper-3': '#E8E7E0',
        ink:     '#111827',
        'ink-2': '#374151',
        'ink-3': '#6B7280',
        'ink-4': '#9CA3AF',
        'ink-5': '#D1D5DB',
        rule:    'rgba(0,0,0,0.07)',
      },
      fontFamily: {
        serif:   ['var(--font-serif)',  'Playfair Display', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)',   'Inter', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',   'JetBrains Mono', 'monospace'],
        // Legacy aliases
        display: ['var(--font-serif)',  'Playfair Display', 'serif'],
        body:    ['var(--font-sans)',   'Inter', 'sans-serif'],
        data:    ['var(--font-mono)',   'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:    '4px',
        md:    '8px',
        lg:    '12px',
        xl:    '16px',
        '2xl': '20px',
      },
      boxShadow: {
        sm:           '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        md:           '0 4px 16px rgba(0,0,0,0.10), 0 16px 48px rgba(0,0,0,0.07)',
        lg:           '0 8px 32px rgba(0,0,0,0.12), 0 24px 64px rgba(0,0,0,0.08)',
        card:         '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        elevated:     '0 4px 16px rgba(0,0,0,0.10), 0 16px 48px rgba(0,0,0,0.07)',
        'hover-green':'inset 2px 0 0 #047857',
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
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-right': {
          '0%':   { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
      animation: {
        'fade-up':     'fade-up 0.35s ease-out both',
        'fade-in':     'fade-in 0.25s ease-out both',
        'pulse-dot':   'pulse-dot 2s ease-in-out infinite',
        shimmer:       'shimmer 1.8s infinite',
        'slide-right': 'slide-right 0.5s cubic-bezier(0.4,0,0.2,1) both',
      },
    },
  },
  plugins: [],
}

export default config
