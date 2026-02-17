import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AppStack } from './AppStack';
import { LightTheme, DarkTheme } from '../theme/theme';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import BootSplash from 'react-native-bootsplash';

const Stack = createStackNavigator();

export const RootStack = () => {
    const scheme = useColorScheme();
    const theme = scheme === 'dark' ? DarkTheme : LightTheme;

    return (
        <PaperProvider theme={theme}>
            <NavigationContainer theme={theme} onReady={() => BootSplash.hide({ fade: true })}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {/* 
            TODO: Add logic to check AsyncStorage for Onboarding status 
            and Keychain for Auth Token to decide initialRouteName
          */}
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Main" component={AppStack} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
};
