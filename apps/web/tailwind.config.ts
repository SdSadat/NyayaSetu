import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        dark: {
          950: '#030712',
          900: '#0a0f1e',
          800: '#0f172a',
          700: '#1a2340',
          600: '#243056',
          500: '#334155',
        },
        neon: {
          cyan: '#06d6dd',
          purple: '#a855f7',
          blue: '#3b82f6',
          teal: '#14b8a6',
          gold: '#f59e0b',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        safety: { light: '#fef3c7', DEFAULT: '#f59e0b', dark: '#92400e' },
        legal: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1e3a8a' },
        trust: { light: '#d1fae5', DEFAULT: '#10b981', dark: '#064e3b' },
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(6,214,221,0.15), rgba(168,85,247,0.08), transparent)',
        'card-glow-cyan': 'radial-gradient(ellipse at top, rgba(6,214,221,0.08), transparent 60%)',
        'card-glow-purple': 'radial-gradient(ellipse at top, rgba(168,85,247,0.08), transparent 60%)',
        'card-glow-gold': 'radial-gradient(ellipse at top, rgba(245,158,11,0.08), transparent 60%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6,214,221,0.15), 0 0 60px rgba(6,214,221,0.05)',
        'glow-purple': '0 0 20px rgba(168,85,247,0.15), 0 0 60px rgba(168,85,247,0.05)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05)',
        'glow-blue': '0 0 20px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)',
        'glass': '0 8px 32px rgba(0,0,0,0.3)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.4)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'typing-dot': 'typing-dot 1.4s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '30%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
