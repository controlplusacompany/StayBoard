import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom branding
        accent: "var(--accent)",
        "accent-light": "var(--accent-light)",
        "accent-dark": "var(--accent-dark)",
        
        // Backgrounds (Renamed for cleaner classes: bg-canvas, bg-surface, bg-sunken)
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        sunken: "var(--bg-sunken)",
        overlay: "var(--bg-overlay)",
        
        // Ink (text)
        "ink-primary": "var(--ink-primary)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-muted": "var(--ink-muted)",
        
        // Status colors
        "status-vacant-bg": "var(--status-vacant-bg)",
        "status-vacant-fg": "var(--status-vacant-fg)",
        "status-occupied-bg": "var(--status-occupied-bg)",
        "status-occupied-fg": "var(--status-occupied-fg)",
        "status-cleaning-bg": "var(--status-cleaning-bg)",
        "status-cleaning-fg": "var(--status-cleaning-fg)",
        "status-maintenance-bg": "var(--status-maintenance-bg)",
        "status-maintenance-fg": "var(--status-maintenance-fg)",
        "status-checkout-bg": "var(--status-checkout-bg)",
        "status-checkout-fg": "var(--status-checkout-fg)",
        "status-arriving-bg": "var(--status-arriving-bg)",
        "status-arriving-fg": "var(--status-arriving-fg)",
        
        // Semantic
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
        info: "var(--info)",
        "info-bg": "var(--info-bg)",
        
        // Borders
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      transitionDuration: {
        fast: "var(--dur-fast)",
        normal: "var(--dur-normal)",
        slow: "var(--dur-slow)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        in: "var(--ease-in)",
        "in-out": "var(--ease-inout)",
        spring: "var(--ease-spring)",
      },
    },
  },
  plugins: [],
};
export default config;
