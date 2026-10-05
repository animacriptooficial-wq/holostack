import { useEffect } from 'react';
import { useAppStore } from '../store';
import { getInitialTheme, saveTheme } from '../services/themeService';

export const useTheme = () => {
  const { theme, toggleTheme } = useAppStore();

  useEffect(() => {
    const initialTheme = getInitialTheme();
    if (initialTheme !== theme) {
      toggleTheme();
    }
  }, []);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  return { theme, toggleTheme };
};