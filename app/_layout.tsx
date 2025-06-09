import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSelectedStore } from '../src/hooks/useSelectedStore';
import { ThemeProvider } from '../src/context/ThemeContext';

// Keep the splash screen visible while we initialize resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const colorScheme = useColorScheme();
  const { selectedStoreId, loading: storeHookLoading } = useSelectedStore();
  const segments = useSegments();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // For demo purposes, just a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // SplashScreen.hideAsync() will be called after navigation decision
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    console.log('[_layout.tsx] useEffect triggered. appIsReady:', appIsReady, 'storeHookLoading:', storeHookLoading, 'selectedStoreId:', selectedStoreId, 'segments:', segments.join('/'));

    if (!appIsReady || storeHookLoading) {
      return; 
    }

    const currentTopLevelSegment = segments[0];
    console.log('[_layout.tsx] currentTopLevelSegment:', currentTopLevelSegment);

    if (selectedStoreId) {
      console.log('[_layout.tsx] Location IS selected. ID:', selectedStoreId);
      if (currentTopLevelSegment !== '(tabs)') {
        console.log('[_layout.tsx] Not in (tabs), navigating to /(tabs)');
        router.replace('/(tabs)');
      } else {
        console.log('[_layout.tsx] Already in (tabs). No navigation needed.');
      }
    } else {
      console.log('[_layout.tsx] Location NOT selected.');
      if (currentTopLevelSegment !== 'select-store') {
        // This covers initial load (currentTopLevelSegment is undefined)
        // and being on any other page when no store is selected.
        console.log(`[_layout.tsx] Current segment is '${currentTopLevelSegment}'. Not 'select-store', navigating to /select-store`);
        router.replace('/select-store');
      } else {
        // currentTopLevelSegment IS 'select-store'
        console.log('[_layout.tsx] Already on select-store and no location selected. No navigation needed.');
      }
    }
    
    // Determine if the app is at a stable route to hide splash
    const isAtTabsWithStore = selectedStoreId && currentTopLevelSegment === '(tabs)';
    const isAtSelectStoreWithoutStore = !selectedStoreId && currentTopLevelSegment === 'select-store';
    // Catches the initial load where segments might be empty, and we are about to redirect to select-store
    const isInitialLoadNoStoreNoSegments = !selectedStoreId && segments[0] === undefined;

    if (isAtTabsWithStore || isAtSelectStoreWithoutStore || isInitialLoadNoStoreNoSegments) {
        SplashScreen.hideAsync();
    }

  }, [appIsReady, storeHookLoading, selectedStoreId, segments, router]);

  if (!appIsReady || storeHookLoading) {
    // Render nothing or a minimal loading component while splash is visible
    return null;
  }

  return (
    <ThemeProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="select-store" 
          options={{
            title: "Choose Location",
            headerShown: false,
            presentation: 'fullScreenModal',
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
