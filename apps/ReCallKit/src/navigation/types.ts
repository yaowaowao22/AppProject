// ============================================================
// ReCallKit ナビゲーション型定義
// 構造:
//   Root (NativeStack)
//   └── DrawerNavigator (サイドバーラッパー)
//       └── MainTabs (BottomTabs)
//           ├── HomeTab     → HomeStack
//           ├── LibraryTab  → LibraryStack
//           ├── ReviewTab   → ReviewStack
//           ├── MapTab      → MapStack
//           └── SettingsTab → SettingsScreen
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
};

// ---- Bottom Tabs ----
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  ReviewTab: NavigatorScreenParams<ReviewStackParamList>;
  MapTab: NavigatorScreenParams<MapStackParamList>;
  SettingsTab: undefined;
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

// ---- Journal Stack (将来用・非表示) ----
export type JournalStackParamList = {
  Journal: undefined;
};
