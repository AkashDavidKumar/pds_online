import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { colors, darkColors } from '../constants/colors';
import { typography } from '../constants/typography';

const { LightTheme: NavLightTheme, DarkTheme: NavDarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

export const LightTheme = {
    ...MD3LightTheme,
    ...NavLightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...NavLightTheme.colors,
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        error: colors.error,
        onPrimary: '#FFFFFF',
        onSurface: colors.text,
    },
    fonts: {
        ...MD3LightTheme.fonts, // Use default or customize properly with configureFonts
    },
    custom: {
        colors: colors,
        typography: typography,
    },
};

export const DarkTheme = {
    ...MD3DarkTheme,
    ...NavDarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...NavDarkTheme.colors,
        primary: darkColors.primary,
        background: darkColors.background,
        surface: darkColors.surface,
        error: darkColors.error,
        onPrimary: '#000000',
        onSurface: darkColors.text,
    },
    custom: {
        colors: darkColors,
        typography: typography,
    },
};

export type AppTheme = typeof LightTheme;
