import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use light theme
  const [theme] = useState<Theme>('light');

  // Apply light theme on mount
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
    root.setAttribute('data-theme', 'light');

    // Update favicon for light theme
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="black" stroke-width="3"/></svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      favicon.href = url;
    }
  }, []);

  const setTheme = () => {
    // No-op: theme toggle disabled for now
  };

  const toggleTheme = () => {
    // No-op: theme toggle disabled for now
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
