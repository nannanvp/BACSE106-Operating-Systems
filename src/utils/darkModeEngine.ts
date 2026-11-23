export type ThemeMode = 'light' | 'dark';

export const DARK_MODE_STORAGE_KEY = 'bacse106_dark_mode_v1';

export function resolveInitialTheme(
  savedValue: string | null,
  prefersDark: boolean
): ThemeMode {
  if (savedValue === 'dark') return 'dark';
  if (savedValue === 'light') return 'light';
  return prefersDark ? 'dark' : 'light';
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}
