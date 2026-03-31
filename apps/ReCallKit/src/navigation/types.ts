// ============================================================
// ReCallKit ナビゲーション型定義
// 構造:
//   Root (NativeStack)
//   └── DrawerNavigator
//       ├── MainTabs (BottomTabs)
//       │   ├── HomeTab     → HomeStack
//       │   ├── LibraryTab  → LibraryStack
//       │   ├── MapTab      → MapStack
//       │   └── JournalTab  → JournalStack
//       └── Settings        → SettingsScreen
// ============================================================

import type { NavigatorScreenParams } from '@react-navigation/native';

// ---- Root ----
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

// ---- Drawer ----
export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Settings: undefined;
};

// ---- Bottom Tabs ----
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  MapTab: NavigatorScreenParams<MapStackParamList>;
  JournalTab: NavigatorScreenParams<JournalStackParamList>;
};

// ---- Home Stack ----
export type HomeStackParamList = {
  Home: undefined;
  Review: { reviewIds?: number[] };
  Quiz: { itemId: number };
};

// ---- Library Stack ----
export type LibraryStackParamList = {
  Library: { filterTag?: string };
  ItemDetail: { itemId: number };
  AddItem: { clipboardText?: string };
};

// ---- Map Stack ----
export type MapStackParamList = {
  KnowledgeMap: undefined;
  ItemDetail: { itemId: number };
};

// ---- Journal Stack ----
export type JournalStackParamList = {
  Journal: undefined;
};
