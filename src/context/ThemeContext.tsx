import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/theme';

type ThemePreference = 'light' | 'dark' | 'auto';
type ColorSet = typeof LightColors;

interface ThemeContextValue {
  isDark: boolean;
  colors: ColorSet;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const THEME_KEY = '@focusflow:theme';

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: LightColors,
  preference: 'auto',
  setPreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'auto') setPreferenceState(v);
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(THEME_KEY, p);
  }, []);

  const isDark = preference === 'auto' ? system === 'dark' : preference === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
