import { useRef, useState, useEffect, type MutableRefObject } from "react";

type FaceLandmarkerType = import("@mediapipe/tasks-vision").FaceLandmarker;

interface UseMediaPipeInitResult {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  landmarkerRef: MutableRefObject<FaceLandmarkerType | null>;
  streamRef: MutableRefObject<MediaStream | null>;
  isLoading: boolean;
  loadingMessage: string;
  initError: string | null;
}

export function useMediaPipeInit(
  onReady: () => void,
  onError: (msg: string) => void,
): UseMediaPipeInitResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerType | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("MediaPipe 초기화 중...");
  const [initError, setInitError] = useState<string | null>(null);

  // onReady/onError 최신 ref
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoadingMessage("MediaPipe 모델 로딩 중...");
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        if (cancelled) return;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) return;

        const MODEL_PATH =
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
        const commonOpts = {
          runningMode: "VIDEO" as const,
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        };

        let faceLandmarker: FaceLandmarkerType;
        try {
          faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
              ...commonOpts,
              baseOptions: { modelAssetPath: MODEL_PATH, delegate: "GPU" },
            }
          );
        } catch {
          // GPU 실패 시 CPU로 재시도 (모바일 Safari 호환)
          setLoadingMessage("CPU 모드로 전환 중...");
          faceLandmarker = await FaceLandmarker.createFromOptions(
            filesetResolver,
            {
              ...commonOpts,
              baseOptions: { modelAssetPath: MODEL_PATH, delegate: "CPU" },
            }
          );
        }

        if (cancelled) return;
        landmarkerRef.current = faceLandmarker;

        // 카메라 시작
        setLoadingMessage("카메라 접근 중...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // autoPlay 속성이 처리 — iOS Safari에서 play() 실패 시 무시
          }
        }

        setIsLoading(false);
        onReadyRef.current();
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : "MediaPipe 초기화에 실패했습니다.";
          onErrorRef.current(msg);
          setInitError(msg);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  return {
    videoRef,
    landmarkerRef,
    streamRef,
    isLoading,
    loadingMessage,
    initError,
  };
}
