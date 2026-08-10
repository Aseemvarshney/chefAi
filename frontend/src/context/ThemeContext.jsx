import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('chefai-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('chefai-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties based on theme
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-card2', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--border', 'rgba(0,0,0,0.1)');
    } else {
      root.style.setProperty('--bg-primary', '#080c14');
      root.style.setProperty('--bg-card', '#0f1624');
      root.style.setProperty('--bg-card2', '#131d2e');
      root.style.setProperty('--text-primary', '#f1f5f9');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--border', 'rgba(255,255,255,0.08)');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}