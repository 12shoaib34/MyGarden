import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultThemeId, isSelectableThemeId, themes } from './themes';
import { getSetting, setSetting } from '../storage/database';

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(defaultThemeId);
  const theme = themes[themeId] || themes[defaultThemeId];

  useEffect(() => {
    getSetting('themeId', defaultThemeId).then((savedThemeId) => {
      if (themes[savedThemeId] && isSelectableThemeId(savedThemeId)) {
        setThemeIdState(savedThemeId);
      }
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    themeId,
    setThemeId: async (nextThemeId) => {
      if (!themes[nextThemeId] || !isSelectableThemeId(nextThemeId)) {
        return;
      }
      setThemeIdState(nextThemeId);
      await setSetting('themeId', nextThemeId);
    },
  }), [theme, themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside AppThemeProvider');
  }
  return context;
}
