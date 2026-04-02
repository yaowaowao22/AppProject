import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import { HistoryScreen, BodyPartDetailScreen, ExerciseDetailScreen } from '../screens/HistoryScreen';
import {
  ExerciseSelectScreen,
  ActiveWorkoutScreen,
  WorkoutCompleteScreen,
} from '../screens/WorkoutScreen';
import type { ReportItem, WorkoutSession, BodyPart, HistoryTabType } from '../types';
import OrderConfirmScreen from '../screens/OrderConfirmScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import RMCalculatorScreen from '../screens/RMCalculatorScreen';
import TemplateManageScreen from '../screens/TemplateManageScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ContactScreen from '../screens/ContactScreen';
import DayDetailScreen from '../screens/DayDetailScreen';
import SessionEditScreen from '../screens/SessionEditScreen';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { StackWithHeader } from '../components/StackWithHeader';

// ── Param lists ──────────────────────────────────────────────────────────────

export type WorkoutStackParamList = {
  ExerciseSelect:  undefined;
  OrderConfirm:    { exerciseIds: string[] };
  ActiveWorkout:   { exerciseIds: string[]; existingWorkoutId?: string; existingSession?: WorkoutSession; fromHome?: boolean };
  WorkoutComplete: { reportItems: ReportItem[]; startedAt: string };
};

export type HistoryStackParamList = {
  HistoryList:    { tab?: HistoryTabType; _key?: number } | undefined;
  DayDetail:      { workoutId: string };
  SessionEdit:    { workoutId: string; exerciseId: string };
  BodyPartDetail: { bodyPart: BodyPart };
  ExerciseDetail: { exerciseId: string };
};

export type SettingsStackParamList = {
  SettingsMain:   undefined;
  PrivacyPolicy:  undefined;
  TermsOfService: undefined;
  Contact:        undefined;
};

export type RootDrawerParamList = {
  Home:          undefined;
  WorkoutStack:  undefined;
  HistoryStack:  undefined;
  MonthlyReport: undefined;
  RMCalculator:    undefined;
  TemplateManage:  undefined;
  SettingsStack:   undefined;
};

// ── Navigators ───────────────────────────────────────────────────────────────

const Drawer         = createDrawerNavigator<RootDrawerParamList>();
const WorkoutStack   = createNativeStackNavigator<WorkoutStackParamList>();
const HistoryStack   = createNativeStackNavigator<HistoryStackParamList>();
const SettingsStack  = createNativeStackNavigator<SettingsStackParamList>();

// ── WorkoutStack ──────────────────────────────────────────────────────────────

function WorkoutStackNavigator() {
  const { colors } = useTheme();
  return (
    <StackWithHeader>
      <WorkoutStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          gestureEnabled: true,
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
    </StackWithHeader>
  );
}

// ── HistoryStack ──────────────────────────────────────────────────────────────

function HistoryStackNavigator() {
  const { colors } = useTheme();
  return (
    <StackWithHeader initialConfig={{ title: '履歴', showHamburger: true }}>
      <HistoryStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <HistoryStack.Screen name="HistoryList"    component={HistoryScreen} />
        <HistoryStack.Screen name="DayDetail"      component={DayDetailScreen} />
        <HistoryStack.Screen name="SessionEdit"    component={SessionEditScreen} />
        <HistoryStack.Screen name="BodyPartDetail" component={BodyPartDetailScreen} />
        <HistoryStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      </HistoryStack.Navigator>
    </StackWithHeader>
  );
}

// ── SettingsStack ────────────────────────────────────────────────────────────

function SettingsStackNavigator() {
  const { colors } = useTheme();
  return (
    <StackWithHeader>
      <SettingsStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <SettingsStack.Screen name="SettingsMain"   component={SettingsScreen} />
        <SettingsStack.Screen name="PrivacyPolicy"  component={PrivacyPolicyScreen} />
        <SettingsStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <SettingsStack.Screen name="Contact"        component={ContactScreen} />
      </SettingsStack.Navigator>
    </StackWithHeader>
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
        options={({ route }) => ({
          title: 'トレーニング',
          swipeEnabled: !(route as any).state || (route as any).state.index === 0,
        })}
        listeners={({ navigation }) => ({
          // ドロワーで再選択されたとき WorkoutStack をリセット（完了画面の再表示を防止）
          // focus ではなく drawerItemPress を使うことで HomeScreen からの
          // プログラム的 navigate と競合しない（二重遷移を防止）
          drawerItemPress: (e) => {
            e.preventDefault();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate('WorkoutStack', { screen: 'ExerciseSelect' });
          },
        })}
      />
      <Drawer.Screen
        name="HistoryStack"
        component={HistoryStackNavigator}
        options={({ route }) => ({
          title: '履歴',
          swipeEnabled: !(route as any).state || (route as any).state.index === 0,
        })}
      />
      <Drawer.Screen name="MonthlyReport" component={MonthlyReportScreen}     options={{ title: '月別レポート' }} />
      <Drawer.Screen name="RMCalculator"    component={RMCalculatorScreen}      options={{ title: 'RM計算機' }} />
      <Drawer.Screen name="TemplateManage" component={TemplateManageScreen}    options={{ title: 'テンプレート管理', headerShown: false }} />
      <Drawer.Screen
        name="SettingsStack"
        component={SettingsStackNavigator}
        options={({ route }) => ({
          title: '設定',
          swipeEnabled: !(route as any).state || (route as any).state.index === 0,
        })}
      />
    </Drawer.Navigator>
  );
}
