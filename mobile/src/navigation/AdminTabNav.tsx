import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize } from '../theme';
import { AdminHomeStackParamList } from './types';
import AdminHomeScreen from '../screens/admin/HomeScreen';
import EmployeeListScreen from '../screens/admin/EmployeeListScreen';
import EmployeeFormScreen from '../screens/admin/EmployeeFormScreen';
import ProductListScreen from '../screens/admin/ProductListScreen';
import ProductFormScreen from '../screens/admin/ProductFormScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import ExportScreen from '../screens/admin/ExportScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator<AdminHomeStackParamList>();

function AdminHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="AdminHome" component={AdminHomeScreen} />
      <HomeStack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <HomeStack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
      <HomeStack.Screen name="ProductList" component={ProductListScreen} />
      <HomeStack.Screen name="ProductForm" component={ProductFormScreen} />
    </HomeStack.Navigator>
  );
}

export default function AdminTabNav() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: FontSize.caption, marginBottom: 4 },
        tabBarStyle: { height: 64, paddingTop: 4 },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="AdminHomeTab"
        component={AdminHomeStack}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          tabBarLabel: '报表',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ExportTab"
        component={ExportScreen}
        options={{
          tabBarLabel: '导出',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="download" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
