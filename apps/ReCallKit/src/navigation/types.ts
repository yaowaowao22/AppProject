// ============================================================
// ReCallKit ナビゲーション型定義
// 構造:
//   Root (NativeStack)
//   └── DrawerNavigator (サイドバー = プライマリナビ)
//       ├── HomeScreen     → HomeStack
//       ├── LibraryScreen  → LibraryStack
//       ├── ReviewScreen   → ReviewStack
//       ├── MapScreen      → MapStack
//       ├── JournalScreen  → JournalStack
//       └── SettingsScreen
// ============================================================

import type { NavigatorScreenParams } from '@react-navigation/native';

// ---- Root ----
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

// ---- Drawer (サイドバーが唯一のプライマリナビ) ----
export type DrawerParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Library: NavigatorScreenParams<LibraryStackParamList>;
  Review: NavigatorScreenParams<ReviewStackParamList>;
  Map: NavigatorScreenParams<MapStackParamList>;
  Journal: NavigatorScreenParams<JournalStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

// ---- Home Stack ----
export type HomeStackParamList = {
  Home: undefined;
};

// ---- Library Stack ----
export type LibraryStackParamList = {
  Library: { filterTag?: string };
  ItemDetail: { itemId: number };
  AddItem: { clipboardText?: string };
};

// ---- Review Stack ----
export type ReviewStackParamList = {
  Review: { reviewIds?: number[] };
  Quiz: { itemId: number };
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

// ---- Settings Stack ----
export type SettingsStackParamList = {
  Settings: undefined;
};
