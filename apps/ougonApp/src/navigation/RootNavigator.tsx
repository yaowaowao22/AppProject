import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from '@expo/vector-icons/Feather';

import { UploadScreen } from '../screens/upload/UploadScreen';
import EditorScreen from '../screens/editor/EditorScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import HistoryDetailScreen from '../screens/history/HistoryDetailScreen';

import type {
  RootTabParamList,
  EditorStackParamList,
  HistoryStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const EditorStack = createNativeStackNavigator<EditorStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

function EditorStackNavigator() {
  return (
    <EditorStack.Navigator screenOptions={{ headerShown: false }}>
      <EditorStack.Screen name="Upload" component={UploadScreen} />
      <EditorStack.Screen name="Editor" component={EditorScreen} />
    </EditorStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="History" component={HistoryScreen} />
      <HistoryStack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
    </HistoryStack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarIcon: ({ color }: { color: string }) => (
          <Feather
            name={route.name === 'EditorStack' ? 'edit-2' : 'grid'}
            size={22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name="EditorStack"
        component={EditorStackNavigator}
        options={{
          tabBarLabel: ({ focused }: { focused: boolean }) => (
            <Text
              style={[
                styles.tabLabel,
                focused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              加工
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="HistoryStack"
        component={HistoryStackNavigator}
        options={{
          tabBarLabel: ({ focused }: { focused: boolean }) => (
            <Text
              style={[
                styles.tabLabel,
                focused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              履歴
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // mock.html: height 82px, border-top 1px #F0F0F0, bg rgba(255,255,255,0.94), padding-top u2(13px)
  tabBar: {
    height: 82,
    paddingTop: 13,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: 'rgba(255,255,255,0.94)',
    elevation: 0,
  },
  tabLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  tabLabelActive: {
    color: '#111111',
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: '#AAAAAA',
    fontWeight: '400',
  },
});
