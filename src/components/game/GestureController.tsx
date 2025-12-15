import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GestureControllerProps {
  onModeChange: (mode: 'tree' | 'heart' | 'scatter') => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onModeChange, isEnabled, setIsEnabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const rafId = useRef<number | null>(null);
  const lastVideoTime = useRef<number>(-1);

  // Load Model
  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      if (recognizerRef.current) return;
      
      try {
        setIsModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        if (!mounted) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (mounted) {
          recognizerRef.current = recognizer;
          setIsModelLoaded(true);
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error("Failed to load gesture recognizer:", error);
        if (mounted) setIsModelLoading(false);
      }
    };

    if (isEnabled && !isModelLoaded) {
      loadModel();
    }

    return () => {
      mounted = false;
    };
  }, [isEnabled, isModelLoaded]);

  // Handle Camera & Detection Loop
  useEffect(() => {
    if (!isEnabled || !recognizerRef.current || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setIsEnabled(false); // Disable if camera fails
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !recognizerRef.current) return;

      const video = videoRef.current;
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        
        try {
          const results = recognizerRef.current.recognizeForVideo(video, Date.now());
          processResults(results);
        } catch (e) {
            console.error(e);
        }
      }
      
      rafId.current = requestAnimationFrame(predictWebcam);
    };

    startCamera();

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isEnabled, isModelLoaded]); // Re-run if enabled changes or model finishes loading

  const processResults = (results: GestureRecognizerResult) => {
    if (results.gestures.length > 0) {
      const category = results.gestures[0][0].categoryName;
      const score = results.gestures[0][0].score;

      if (score > 0.5) {
        setDetectedGesture(category);
        
        // Map gestures
        if (category === 'Open_Palm') {
          onModeChange('scatter');
        } else if (category === 'Closed_Fist') {
          onModeChange('tree');
        } else if (category === 'Victory' || category === 'ILoveYou' || category === 'Thumb_Up') {
          onModeChange('heart');
        }
      }
    } else {
      setDetectedGesture('');
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="absolute bottom-32 right-8 z-40 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 duration-500">
      {/* Loading State */}
      {isModelLoading && (
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-emerald-100 flex items-center gap-2">
           <Loader2 className="animate-spin w-4 h-4" />
           <span className="text-xs">加载模型中...</span>
        </div>
      )}

      {/* Video Preview */}
      <div className={cn(
        "relative w-48 h-36 bg-black rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all",
        isModelLoaded ? "opacity-100" : "opacity-0"
      )}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100" // Mirror effect
        />
        
        {/* Gesture Indicator overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-center">
            <span className="text-xs font-mono text-emerald-400 font-bold">
                {detectedGesture ? `识别: ${detectedGesture}` : "等待手势..."}
            </span>
        </div>
      </div>

      {/* Helper Text */}
      {isModelLoaded && (
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-[200px] text-xs text-gray-300 space-y-1">
            <p>🖐️ <b>张开手掌</b>: 散开</p>
            <p>✊ <b>握紧拳头</b>: 聚合</p>
            <p>✌️ <b>V字手势</b>: 爱心</p>
        </div>
      )}
    </div>
  );
};
