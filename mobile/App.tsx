import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paperTheme } from './src/theme';
import { useAuthStore } from './src/stores/auth.store';
import RootNavigator from './src/navigation';
import LoadingOverlay from './src/components/LoadingOverlay';
import ErrorBoundary from './src/components/ErrorBoundary';

function Main() {
  const { checkSession, isLoading } = useAuthStore();
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    checkSession().catch((e: any) => setInitError(e?.message || String(e)));
  }, []);

  if (initError) {
    return (
      <View style={es.c}>
        <Text style={es.t}>初始化错误</Text>
        <Text style={es.m}>{initError}</Text>
      </View>
    );
  }

  if (isLoading) return <LoadingOverlay />;

  return (
    <>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="dark" />
      <Toast />
    </>
  );
}

const es = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  t: { fontSize: 22, fontWeight: '700', color: '#F44336', marginBottom: 12 },
  m: { fontSize: 14, color: '#666', textAlign: 'center' },
});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <Main />
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
