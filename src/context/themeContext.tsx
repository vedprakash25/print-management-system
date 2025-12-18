import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext({
  theme: "dark" as Theme,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("theme") === "light" ? "light" : "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
