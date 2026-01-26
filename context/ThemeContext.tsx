import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('elixr_theme');
    return (saved as Theme) || 'light';
  });

  // Apply theme immediately on mount
  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      const root = document.documentElement;
      const body = document.body;

      if (themeToApply === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
        root.setAttribute('data-theme', 'dark');
      }
    };

    // Apply immediately
    applyTheme(theme);
    localStorage.setItem('elixr_theme', theme);

    // Update favicon for theme
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      // Create SVG with appropriate color
      const color = theme === 'light' ? 'black' : 'white';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="3"/></svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      favicon.href = url;
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
