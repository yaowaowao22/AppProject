import type { FaceLandmarks } from '../types/face';

export type RootStackParamList = {
  Upload: undefined;
  Editor: {
    imageUri: string;
    landmarks: FaceLandmarks;
  };
};
