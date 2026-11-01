import { useState } from "react";

const KEY = "theme";

export function getTheme() {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
}

/** const [theme, toggle] = useTheme()  - persists to localStorage and flips <html class="light"> */
export function useTheme() {
  const [theme, setTheme] = useState(getTheme);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: still switch for this session */
    }
    applyTheme(next);
    setTheme(next);
  };
  return [theme, toggle];
}
