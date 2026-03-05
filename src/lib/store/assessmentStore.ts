import { create } from "zustand";

// VD 판정 결과
export type VDVerdict = "NORMAL" | "LOWER";

// 랜드마크 좌표
export interface LandmarkPoint {
  x: number;
  y: number;
}

// Willis 키포인트
export interface WillisKeypoints {
  leftPupil: LandmarkPoint;
  rightPupil: LandmarkPoint;
  subnasale: LandmarkPoint;
  rimaOris: LandmarkPoint;
  chin: LandmarkPoint;
}

// 단일 촬영 결과
export interface PhotoResult {
  uri: string;
  base64?: string;
  keypoints?: WillisKeypoints;
  willisRatio?: number;
  verdict?: VDVerdict;
  timestamp: number;
}

// 평가 세션 상태
interface AssessmentState {
  // 현재 단계 (1~4)
  currentStep: number;
  // 1단계 촬영 결과
  initialPhoto: PhotoResult | null;
  // 3단계 촬영 결과
  verifyPhoto: PhotoResult | null;
  // 세션 시작 시간
  sessionStartTime: number | null;
  // 환자 ID (Phase 5에서 연동)
  patientId: string | null;
  // 메모
  notes: string;

  // 액션
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setInitialPhoto: (photo: PhotoResult) => void;
  setVerifyPhoto: (photo: PhotoResult) => void;
  setPatientId: (id: string) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  initialPhoto: null,
  verifyPhoto: null,
  sessionStartTime: null,
  patientId: null,
  notes: "",
};

export const useAssessmentStore = create<AssessmentState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setInitialPhoto: (photo) =>
    set({
      initialPhoto: photo,
      sessionStartTime: Date.now(),
    }),

  setVerifyPhoto: (photo) => set({ verifyPhoto: photo }),

  setPatientId: (id) => set({ patientId: id }),

  setNotes: (notes) => set({ notes }),

  reset: () => set(initialState),
}));
