import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabaseClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // One-time AsyncStorage clear for legacy accounts
  useEffect(() => {
    AsyncStorage.clear();
  }, []);

  // Minimal Supabase fetch test
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('categories').select('*').limit(1);
      console.log('Supabase fetch test:', data, error);
    })();
  }, []);

  // Manual fetch test with explicit headers
  useEffect(() => {
    fetch('https://rqjutktofptxzwycfdiw.supabase.co/rest/v1/categories?select=*', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanV0a3RvZnB0eHp3eWNmZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5Mzg1NjMsImV4cCI6MjA2NjUxNDU2M30.Vxx0RYVENdR0TRqFsXrj4WhXUVp9l6a4BjLkn4zFeU4',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanV0a3RvZnB0eHp3eWNmZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5Mzg1NjMsImV4cCI6MjA2NjUxNDU2M30.Vxx0RYVENdR0TRqFsXrj4WhXUVp9l6a4BjLkn4zFeU4',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => console.log('Manual fetch with headers:', data))
      .catch(err => console.log('Manual fetch error:', err));
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <DataProvider>
        <AuthGate />
        <StatusBar style="light" />
      </DataProvider>
    </AuthProvider>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <AuthScreen />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="EditUsername" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}