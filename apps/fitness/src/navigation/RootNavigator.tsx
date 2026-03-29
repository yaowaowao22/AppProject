import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import {
  ExerciseSelectScreen,
  ActiveWorkoutScreen,
  WorkoutCompleteScreen,
} from '../screens/WorkoutScreen';
import type { ReportItem, WorkoutSession } from '../types';
import OrderConfirmScreen from '../screens/OrderConfirmScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import RMCalculatorScreen from '../screens/RMCalculatorScreen';
import TemplateManageScreen from '../screens/TemplateManageScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DayDetailScreen from '../screens/DayDetailScreen';
import SessionEditScreen from '../screens/SessionEditScreen';
import { CustomDrawerContent } from '../components/CustomDrawerContent';

// ── Param lists ──────────────────────────────────────────────────────────────

export type WorkoutStackParamList = {
  ExerciseSelect:  undefined;
  OrderConfirm:    { exerciseIds: string[] };
  ActiveWorkout:   { exerciseIds: string[]; existingWorkoutId?: string; existingSession?: WorkoutSession };
  WorkoutComplete: { reportItems: ReportItem[]; startedAt: string };
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  DayDetail:   { workoutId: string };
  SessionEdit: { workoutId: string; exerciseId: string };
};

export type ProgressStackParamList = {
  ProgressHome: undefined;
  DayDetail:    { workoutId: string };
  SessionEdit:  { workoutId: string; exerciseId: string };
};

export type RootDrawerParamList = {
  Home:          undefined;
  WorkoutStack:  undefined;
  HistoryStack:  undefined;
  ProgressStack: undefined;
  MonthlyReport: undefined;
  RMCalculator:    undefined;
  TemplateManage:  undefined;
  Settings:        undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Drawer        = createDrawerNavigator<RootDrawerParamList>();
const WorkoutStack  = createNativeStackNavigator<WorkoutStackParamList>();
const HistoryStack  = createNativeStackNavigator<HistoryStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();

// ── WorkoutStack ──────────────────────────────────────────────────────────────

function WorkoutStackNavigator() {
  const { colors } = useTheme();
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <WorkoutStack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} />
      <WorkoutStack.Screen name="OrderConfirm"   component={OrderConfirmScreen} />
      <WorkoutStack.Screen name="ActiveWorkout"  component={ActiveWorkoutScreen} />
      <WorkoutStack.Screen
        name="WorkoutComplete"
        component={WorkoutCompleteScreen}
        options={{
          presentation: 'card',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </WorkoutStack.Navigator>
  );
}

// ── HistoryStack ──────────────────────────────────────────────────────────────

function HistoryStackNavigator() {
  const { colors } = useTheme();
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen name="DayDetail"   component={DayDetailScreen} />
      <HistoryStack.Screen name="SessionEdit" component={SessionEditScreen} />
    </HistoryStack.Navigator>
  );
}

// ── ProgressStack ─────────────────────────────────────────────────────────────

function ProgressStackNavigator() {
  const { colors } = useTheme();
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <ProgressStack.Screen name="ProgressHome" component={ProgressScreen} />
      <ProgressStack.Screen name="DayDetail"    component={DayDetailScreen} />
      <ProgressStack.Screen name="SessionEdit"  component={SessionEditScreen} />
    </ProgressStack.Navigator>
  );
}

// ── RootNavigator ─────────────────────────────────────────────────────────────

export function RootNavigator() {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.surface1, width: '75%' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="Home"          component={HomeScreen}              options={{ title: 'ホーム' }} />
      <Drawer.Screen
        name="WorkoutStack"
        component={WorkoutStackNavigator}
        options={{ title: 'トレーニング' }}
        listeners={({ navigation }) => ({
          // ドロワーで再選択されたとき WorkoutStack をリセット（完了画面の再表示を防止）
          focus: () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
          },
        })}
      />
      <Drawer.Screen name="HistoryStack"  component={HistoryStackNavigator}   options={{ title: '履歴' }} />
      <Drawer.Screen name="ProgressStack" component={ProgressStackNavigator}  options={{ title: '進捗' }} />
      <Drawer.Screen name="MonthlyReport" component={MonthlyReportScreen}     options={{ title: '月別レポート' }} />
      <Drawer.Screen name="RMCalculator"    component={RMCalculatorScreen}      options={{ title: 'RM計算機' }} />
      <Drawer.Screen name="TemplateManage" component={TemplateManageScreen}    options={{ title: 'テンプレート管理', headerShown: false }} />
      <Drawer.Screen name="Settings"       component={SettingsScreen}          options={{ title: '設定' }} />
    </Drawer.Navigator>
  );
}
