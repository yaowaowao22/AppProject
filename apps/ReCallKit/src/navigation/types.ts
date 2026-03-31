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
  Settings: undefined;
};

// ---- Home Stack ----
export type HomeStackParamList = {
  Home: undefined;
  Journal: undefined;
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

// ---- Journal Stack (将来用・非表示) ----
export type JournalStackParamList = {
  Journal: undefined;
};
