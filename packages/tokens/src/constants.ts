/**
 * Default token fallbacks used when an inquiry profile
 * does not provide sufficient axis data for derivation.
 * All values use CSS custom property references where possible.
 */
export const TOKEN_DEFAULTS = {
  spacing: {
    '0': '0px',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
  },
  typography: {
    'font-sans': "'Inter Variable', system-ui, -apple-system, sans-serif",
    'font-display': "'Playfair Display Variable', Georgia, serif",
    'font-mono': "'JetBrains Mono Variable', 'Fira Code', monospace",
    'size-xs': '0.75rem',
    'size-sm': '0.875rem',
    'size-base': '1rem',
    'size-lg': '1.125rem',
    'size-xl': '1.25rem',
    'size-2xl': '1.5rem',
    'size-3xl': '1.875rem',
    'size-4xl': '2.25rem',
    'leading-tight': '1.25',
    'leading-normal': '1.5',
    'leading-relaxed': '1.75',
  },
  elevation: {
    'shadow-sm': '0 1px 2px 0 hsl(240 10% 12% / 0.05)',
    'shadow-md': '0 4px 6px -1px hsl(240 10% 12% / 0.1), 0 2px 4px -2px hsl(240 10% 12% / 0.1)',
    'shadow-lg': '0 10px 15px -3px hsl(240 10% 12% / 0.1), 0 4px 6px -4px hsl(240 10% 12% / 0.1)',
    'shadow-xl': '0 20px 25px -5px hsl(240 10% 12% / 0.1), 0 8px 10px -6px hsl(240 10% 12% / 0.1)',
    'shadow-material': '0 0 0 1px hsl(240 10% 88%), 0 8px 32px hsl(290 40% 55% / 0.15)',
  },
} as const;
