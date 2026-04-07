// ============================================================
// ReCallKit ナビゲーション型定義
// 構造:
//   Root (NativeStack)
//   └── DrawerNavigator (サイドバー = プライマリナビ)
//       ├── Home     → HomeStack
//       ├── Library  → LibraryStack
//       ├── Review   → ReviewStack
//       ├── Map      → MapStack
//       ├── Journal  → JournalStack
//       ├── Settings → SettingsStack
//       ├── Tasks    → TaskStack
//       └── History  → HistoryStack
// ============================================================

import type { NavigatorScreenParams } from '@react-navigation/native';

// ---- Shared params ----
export type QAPreviewParams = {
  url: string;
  title: string;
  summary: string;
  qa_pairs: { question: string; answer: string }[];
  category: string;
};

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
  Tasks: NavigatorScreenParams<TaskStackParamList> | undefined;
  History: NavigatorScreenParams<HistoryStackParamList> | undefined;
};

// ---- Home Stack ----
export type HomeStackParamList = {
  HomeMain: undefined;
  ItemDetail: { itemId: number };
};

// ---- Library Stack ----
export type LibraryStackParamList = {
  LibraryMain: { filterTag?: string };
  ItemDetail: { itemId: number };
  AddItem: { clipboardText?: string };
  URLAnalysis: { initialUrl?: string };
  URLImportList: undefined;
  QAPreview: QAPreviewParams;
  ReviewGroupCreate: undefined;
};

// ---- Review Stack ----
export type ReviewStackParamList = {
  ReviewSelect: undefined;
  ReviewSession: { reviewIds?: number[]; forceAll?: boolean };
  Quiz: { itemIds: number[] };
};

// ---- Map Stack ----
export type MapStackParamList = {
  KnowledgeMap: undefined;
  ItemDetail: { itemId: number };
};

// ---- Journal Stack ----
export type JournalStackParamList = {
  JournalMain: undefined;
};

// ---- Settings Stack ----
export type SettingsStackParamList = {
  SettingsMain: undefined;
  AIModel: undefined;
};

// ---- Task Stack ----
export type TaskStackParamList = {
  TaskList: undefined;
  QAPreview: QAPreviewParams;
};

// ---- History Stack ----
export type HistoryStackParamList = {
  HistoryMain: undefined;
};
