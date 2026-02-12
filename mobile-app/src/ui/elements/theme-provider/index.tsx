import { createContext, useEffect, useState } from "react";
import { THEME_IDS, type ThemeId } from "@/pixi/utils/colors";

type Theme = "dark" | "light" | "system";
type ThemeTemplate = ThemeId;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultThemeTemplate?: ThemeTemplate;
  storageKey?: string;
  storageKeyTemplate?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeTemplate: ThemeTemplate;
  setThemeTemplate: (themeTemplate: ThemeTemplate) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  themeTemplate: "theme-1",
  setThemeTemplate: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function isValidThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultThemeTemplate = "theme-1",
  storageKey = "vite-ui-theme",
  storageKeyTemplate = "vite-ui-theme-template",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [themeTemplate, setThemeTemplate] = useState<ThemeTemplate>(() => {
    const stored = localStorage.getItem(storageKeyTemplate);
    return stored && isValidThemeId(stored) ? stored : defaultThemeTemplate;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    THEME_IDS.forEach(id => root.classList.remove(id));

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    root.classList.add(themeTemplate);
  }, [theme, themeTemplate]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    themeTemplate,
    setThemeTemplate: (themeTemplate: ThemeTemplate) => {
      localStorage.setItem(storageKeyTemplate, themeTemplate);
      setThemeTemplate(themeTemplate);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
