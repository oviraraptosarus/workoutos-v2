/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '1rem',
        },
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: {
                    DEFAULT: 'var(--primary)',
                    foreground: 'var(--primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--secondary)',
                    foreground: 'var(--secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)',
                },
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)',
                },
                card: {
                    DEFAULT: 'var(--card)',
                    foreground: 'var(--card-foreground)',
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
                positive: 'var(--positive)',
                warning: 'var(--warning)',
                danger: 'var(--danger)',
                info: 'var(--info)',
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
                sm: 'calc(var(--radius) - 4px)',
                md: 'var(--radius)',
                lg: 'calc(var(--radius) + 4px)',
                xl: 'calc(var(--radius) + 8px)',
                '2xl': 'calc(var(--radius) + 16px)',
                '3xl': 'calc(var(--radius) + 24px)',
            },
            fontFamily: {
                sans: [
                    '-apple-system', 
                    'BlinkMacSystemFont', 
                    '"SF Pro Display"', 
                    '"SF Pro Text"', 
                    'var(--font-inter)', 
                    '"Helvetica Neue"', 
                    'Helvetica', 
                    'Arial', 
                    'sans-serif'
                ],
                mono: ['IBM Plex Mono', 'monospace'],
            },
            boxShadow: {
                card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                'card-lg': '0 8px 30px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
                'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
            },
            animation: {
                'fade-in': 'fadeIn 250ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
                'slide-up': 'slideUp 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
                'pulse-highlight': 'pulseHighlight 800ms ease',
                'sheet-up': 'sheetUp 400ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
                'blob': 'blob 15s infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                sheetUp: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                }
            }
        },
    },
    plugins: [require('@tailwindcss/typography')],
};