import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FaceLandmarks } from '../types/face';
import type { HistoryRecord } from '../types/history';

/** EditorStack 内の画面パラメータ */
export type EditorStackParamList = {
  Upload: undefined;
  Editor: {
    imageUri: string;
    landmarks: FaceLandmarks;
    imageWidth: number;
    imageHeight: number;
  };
};

/** 後方互換エイリアス（UploadScreen が既に import 済み） */
export type RootStackParamList = EditorStackParamList;

/** HistoryStack 内の画面パラメータ */
export type HistoryStackParamList = {
  History: undefined;
  HistoryDetail: { record: HistoryRecord };
};

/** BottomTab のルートパラメータ */
export type RootTabParamList = {
  EditorStack: NavigatorScreenParams<EditorStackParamList>;
  HistoryStack: NavigatorScreenParams<HistoryStackParamList>;
};
