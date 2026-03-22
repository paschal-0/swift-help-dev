import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import { CreateAccountScreen } from './src/screens/CreateAccountScreen';
import { GetStartedScreen } from './src/screens/GetStartedScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f8fafc',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: '#f8fafc',
            },
            contentStyle: {
              backgroundColor: '#f8fafc',
            },
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
          />
          <Stack.Screen
            name="GetStarted"
            component={GetStartedScreen}
          />
          <Stack.Screen
            name="CreateAccount"
            component={CreateAccountScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
