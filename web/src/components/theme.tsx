'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

const KEY = 'pdfapi-theme';

const ThemeCtx = createContext<{
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}>({ theme: 'system', resolved: 'light', setTheme: () => {} });

export const useTheme = () => useContext(ThemeCtx);

/**
 * Скрипт, который выполняется ДО первой отрисовки.
 *
 * Без него страница успевает мигнуть светлой темой, прежде чем React
 * загрузится и поставит тёмную. Это заметно и выглядит как брак, поэтому
 * атрибут ставится синхронно в <head>.
 */
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('${KEY}');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    let stored: Theme = 'system';
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'dark' || v === 'light') stored = v;
    } catch {
      // приватный режим или запрещённые куки — просто остаёмся на системной
    }
    setThemeState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      if (theme === 'system') {
        root.removeAttribute('data-theme');
        setResolved(mq.matches ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', theme);
        setResolved(theme);
      }
    };

    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      if (t === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, t);
    } catch {
      /* не смертельно: тема просто не запомнится */
    }
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
