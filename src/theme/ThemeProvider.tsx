import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

type ThemeCtx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; isDark: boolean };

const Ctx = createContext<ThemeCtx>({ mode: "auto", setMode: () => {}, isDark: false });
const KEY = "theme_mode";

function systemDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "auto";
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "auto" ? v : "auto";
  });
  const [sysDark, setSysDark] = useState(systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSysDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = mode === "auto" ? sysDark : mode === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (m: ThemeMode) => {
        setModeState(m);
        window.localStorage.setItem(KEY, m);
      },
      isDark,
    }),
    [mode, isDark],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
