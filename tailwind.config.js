/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-card': 'var(--bg-card)',
        'bg-card-hover': 'var(--bg-card-hover)',

        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-accent': 'var(--border-accent)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',

        'accent-primary': 'var(--accent-primary)',
        'accent-purple': 'var(--accent-purple)',
        'accent-purple-light': 'var(--accent-purple-light)',
        'accent-purple-bg': 'var(--accent-purple-bg)',

        success: 'var(--success)',
        'success-bg': 'var(--success-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',

        'risk-high': 'var(--risk-high)',
        'risk-medium': 'var(--risk-medium)',
        'risk-low': 'var(--risk-low)',

        'graph-bg': 'var(--graph-bg)',
        'chart-grid': 'var(--chart-grid)',
        'chart-axis': 'var(--chart-axis)',
        'chart-tooltip-bg': 'var(--chart-tooltip-bg)',
        'chart-tooltip-border': 'var(--chart-tooltip-border)',
      },
    },
  },
  plugins: [],
};
