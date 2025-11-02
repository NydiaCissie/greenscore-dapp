export const designTokens = {
  seed: "db74d98a03ff2e3aed13416a7783499d9849c4177146cb86f74420b4c01b8311",
  color: {
    light: {
      background: "#f4f8f5",
      surface: "#ffffff",
      surfaceMuted: "#e2ede5",
      primary: "#1f8a52",
      primaryStrong: "#10643a",
      primaryMuted: "#97d4b0",
      accent: "#f0a327",
      accentStrong: "#c47e11",
      critical: "#c7423d",
      onBackground: "#13221b",
      onSurface: "#1a2d23",
      onPrimary: "#ffffff",
      onAccent: "#1a1200",
      outline: "#5e7b6d",
    },
    dark: {
      background: "#081510",
      surface: "#11261d",
      surfaceMuted: "#163425",
      primary: "#4ad287",
      primaryStrong: "#3bb272",
      primaryMuted: "#225539",
      accent: "#f6b244",
      accentStrong: "#d99127",
      critical: "#f4746f",
      onBackground: "#f3f9f5",
      onSurface: "#dfeee6",
      onPrimary: "#0c1d16",
      onAccent: "#0f0900",
      outline: "#4c9a73",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    heading: {
      weight: 600,
      lineHeight: 1.2,
      scale: {
        xs: "1.75rem",
        sm: "2.125rem",
        md: "2.5rem",
        lg: "3rem",
      },
    },
    body: {
      weight: 400,
      lineHeight: 1.6,
      size: {
        xs: "0.95rem",
        sm: "1rem",
        md: "1.05rem",
        lg: "1.1rem",
      },
    },
    label: {
      weight: 500,
      lineHeight: 1.4,
      size: {
        xs: "0.8rem",
        sm: "0.85rem",
        md: "0.9rem",
        lg: "0.95rem",
      },
    },
  },
  radii: {
    base: "14px",
    pill: "999px",
  },
  layout: {
    contentMaxWidth: "1180px",
    gridGap: {
      comfortable: "32px",
      compact: "20px",
    },
  },
  spacing: {
    comfortable: {
      xs: "8px",
      sm: "12px",
      md: "20px",
      lg: "32px",
      xl: "48px",
    },
    compact: {
      xs: "6px",
      sm: "10px",
      md: "16px",
      lg: "24px",
      xl: "36px",
    },
  },
  motion: {
    duration: {
      quick: "120ms",
      base: "180ms",
      gentle: "280ms",
    },
    easing: {
      standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      entrance: "cubic-bezier(0.26, 0.86, 0.44, 1)",
      exit: "cubic-bezier(0.33, 0.04, 0.67, 0.03)",
    },
  },
  breakpoints: {
    tiers: {
      sm: "640px",
      md: "960px",
      lg: "1280px",
    },
  },
} as const;

export type DensityMode = "comfortable" | "compact";


