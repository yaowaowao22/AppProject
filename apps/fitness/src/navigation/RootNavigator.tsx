import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import {
  ExerciseSelectScreen,
  ActiveWorkoutScreen,
} from '../screens/WorkoutScreen';

// ── Param lists ──────────────────────────────────────────────────────────────

export type WorkoutStackParamList = {
  ExerciseSelect: undefined;
  ActiveWorkout:  { exerciseIds: string[] };
};

export type RootTabParamList = {
  Home:         undefined;
  WorkoutStack: undefined;
  History:      undefined;
  Progress:     undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Tab          = createBottomTabNavigator<RootTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();

function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <WorkoutStack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} />
      <WorkoutStack.Screen name="ActiveWorkout"  component={ActiveWorkoutScreen} />
    </WorkoutStack.Navigator>
  );
}

export function RootNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor:  COLORS.separator,
          borderTopWidth:  1,
          height:          60 + insets.bottom,
          paddingBottom:   insets.bottom,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   COLORS.accent,
        tabBarInactiveTintColor: 'rgba(245,245,247,0.4)',
        tabBarLabelStyle: {
          fontSize:     11,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkoutStack"
        component={WorkoutStackNavigator}
        options={{
          title: 'トレーニング',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'fitness' : 'fitness-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: '履歴',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: '進捗',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

