import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize } from '../theme';
import { WorkerHomeStackParamList } from './types';
import HomeScreen from '../screens/worker/HomeScreen';
import PieceEntryScreen from '../screens/worker/PieceEntryScreen';
import TimeClockScreen from '../screens/worker/TimeClockScreen';
import DailyReportScreen from '../screens/worker/DailyReportScreen';
import PayslipScreen from '../screens/worker/PayslipScreen';
import ProfileScreen from '../screens/worker/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator<WorkerHomeStackParamList>();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="WorkerHome" component={HomeScreen} />
      <HomeStack.Screen name="PieceEntry" component={PieceEntryScreen} />
      <HomeStack.Screen name="TimeClock" component={TimeClockScreen} />
    </HomeStack.Navigator>
  );
}

export default function WorkerTabNav() {
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
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DailyTab"
        component={DailyReportScreen}
        options={{
          tabBarLabel: '日报',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PayslipTab"
        component={PayslipScreen}
        options={{
          tabBarLabel: '工资条',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
