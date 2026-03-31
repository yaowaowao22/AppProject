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
// | undefined を付与することで navigate('Review') の単引数形式を型エラーなく使用可能にする
export type DrawerParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Library: NavigatorScreenParams<LibraryStackParamList> | undefined;
  Review: NavigatorScreenParams<ReviewStackParamList> | undefined;
  Map: NavigatorScreenParams<MapStackParamList> | undefined;
  Journal: NavigatorScreenParams<JournalStackParamList> | undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
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
  URLAnalysis: { initialUrl?: string };
  QAPreview: {
    url: string;
    title: string;
    summary: string;
    qa_pairs: { question: string; answer: string }[];
    category: string;
  };
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
