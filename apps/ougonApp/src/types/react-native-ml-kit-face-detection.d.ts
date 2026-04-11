/**
 * Type declarations for @react-native-ml-kit/face-detection
 * Covers the subset of the API used in useFaceDetect.ts
 */
declare module '@react-native-ml-kit/face-detection' {
  export interface FaceLandmark {
    type: string;
    position: { x: number; y: number };
  }

  export interface Face {
    landmarks?: FaceLandmark[];
    bounds?: {
      origin: { x: number; y: number };
      size: { width: number; height: number };
    };
  }

  export interface FaceDetectionOptions {
    landmarkMode?: 'none' | 'all';
    performanceMode?: 'fast' | 'accurate';
    classificationMode?: 'none' | 'all';
  }

  const FaceDetection: {
    detect(imageUrl: string, options?: FaceDetectionOptions): Promise<Face[]>;
  };

  export default FaceDetection;
}
