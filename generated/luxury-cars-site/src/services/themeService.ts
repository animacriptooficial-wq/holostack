export const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  }
  return 'light';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('theme', theme);
  }
};