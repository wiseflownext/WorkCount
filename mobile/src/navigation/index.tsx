import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../stores/auth.store';
import { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import WorkerTabNav from './WorkerTabNav';
import AdminTabNav from './AdminTabNav';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, currentUser } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : currentUser?.role === 'admin' ? (
        <Stack.Screen name="AdminTabs" component={AdminTabNav} />
      ) : (
        <Stack.Screen name="WorkerTabs" component={WorkerTabNav} />
      )}
    </Stack.Navigator>
  );
}
