import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type DensityMode = "comfortable" | "compact";

type ThemeState = {
  theme: ThemeMode;
  density: DensityMode;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
};

const THEME_KEY = "greenscore.ui.theme";
const DENSITY_KEY = "greenscore.ui.density";

function readLocalStorage<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  return (stored as T) ?? fallback;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  density: "comfortable",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  },
  setDensity: (density) => {
    set({ density });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DENSITY_KEY, density);
    }
  },
}));

export function hydrateThemeStore() {
  if (typeof window === "undefined") return;
  const theme = readLocalStorage<ThemeMode>(THEME_KEY, "system");
  const density = readLocalStorage<DensityMode>(DENSITY_KEY, "comfortable");
  useThemeStore.setState({ theme, density });
}


