import { createContext, useEffect, useState } from "react";
import {
  loadThemeTemplate,
  saveThemeTemplate,
  THEME_IDS,
  type ThemeId,
} from "@/config/themes";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultThemeTemplate?: ThemeId;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeTemplate: ThemeId;
  /** Set the active theme. Pass `save = false` for temporary overrides (e.g. zone themes). */
  setThemeTemplate: (themeTemplate: ThemeId, save?: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  themeTemplate: "theme-1",
  setThemeTemplate: () => {},
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultThemeTemplate = "theme-1",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [themeTemplate, setThemeTemplate] = useState<ThemeId>(() => {
    const stored = loadThemeTemplate();
    return THEME_IDS.includes(stored) ? stored : defaultThemeTemplate;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    root.dataset.theme = themeTemplate;
  }, [theme, themeTemplate]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    themeTemplate,
    setThemeTemplate: (nextThemeTemplate: ThemeId, save = true) => {
      if (!THEME_IDS.includes(nextThemeTemplate)) return;
      if (save) saveThemeTemplate(nextThemeTemplate);
      setThemeTemplate(nextThemeTemplate);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export type { ThemeId };
