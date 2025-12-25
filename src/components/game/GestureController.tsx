import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GestureControllerProps {
  onModeChange: (mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onModeChange, isEnabled, setIsEnabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [error, setError] = useState<string>('');
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const rafId = useRef<number | null>(null);
  const lastVideoTime = useRef<number>(-1);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Use ref to keep track of the latest callback without triggering effect re-run
  const onModeChangeRef = useRef(onModeChange);
  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  // Load Model
  useEffect(() => {
    let mounted = true;

    const loadModel = async () => {
      if (recognizerRef.current) return;
      
      try {
        setIsModelLoading(true);
        setError('');
        
        const vision = await FilesetResolver.forVisionTasks(
          "https://resource-static.cdn.bcebos.com/common/task-vision"
        );
        
        if (!mounted) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://resource-static.cdn.bcebos.com/common/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (mounted) {
          recognizerRef.current = recognizer;
          setIsModelLoaded(true);
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error("加载手势识别模型失败:", error);
        if (mounted) {
          setIsModelLoading(false);
          setError('模型加载失败，请刷新重试');
          setIsEnabled(false);
        }
      }
    };

    if (isEnabled && !isModelLoaded && !recognizerRef.current) {
      loadModel();
    }

    return () => {
      mounted = false;
    };
  }, [isEnabled, isModelLoaded, setIsEnabled]);

  // Handle Camera & Detection Loop
  useEffect(() => {
    if (!isEnabled || !recognizerRef.current || !videoRef.current) {
      // Clean up if disabled
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        setError('');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              predictWebcam();
            }).catch(err => {
              console.error("视频播放失败:", err);
              setError('视频播放失败');
            });
          };
        }
      } catch (err) {
        console.error("摄像头访问失败:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
          setError('摄像头权限被拒绝，请在浏览器设置中允许访问');
        } else if (errorMsg.includes('NotFoundError')) {
          setError('未找到摄像头设备');
        } else {
          setError('摄像头启动失败: ' + errorMsg);
        }
        setIsEnabled(false);
      }
    };

    const predictWebcam = () => {
      if (!videoRef.current || !recognizerRef.current || !isEnabled) return;

      const video = videoRef.current;
      
      // Check if video is ready
      if (video.readyState < 2) {
        rafId.current = requestAnimationFrame(predictWebcam);
        return;
      }

      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        
        try {
          const results = recognizerRef.current.recognizeForVideo(video, Date.now());
          processResults(results);
        } catch (e) {
          console.error("手势识别错误:", e);
        }
      }
      
      rafId.current = requestAnimationFrame(predictWebcam);
    };

    startCamera();

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isEnabled, isModelLoaded, setIsEnabled]);

  const processResults = (results: GestureRecognizerResult) => {
    if (results.gestures.length > 0) {
      const category = results.gestures[0][0].categoryName;
      const score = results.gestures[0][0].score;

      if (score > 0.6) {
        setDetectedGesture(category);
        
        // Map gestures
        if (category === 'Open_Palm') {
          onModeChangeRef.current('scatter');
        } else if (category === 'Closed_Fist') {
          onModeChangeRef.current('tree');
        } else if (category === 'Victory') {
          onModeChangeRef.current('heart');
        } else if (category === 'Thumb_Up') {
          onModeChangeRef.current('saturn');
        } else if (category === 'Pointing_Up') {
          onModeChangeRef.current('flower');
        }
      }
    } else {
      setDetectedGesture('');
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="absolute bottom-32 right-8 z-40 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 duration-500">
      {/* Error State */}
      {error && (
        <div className="bg-red-900/80 backdrop-blur-md px-4 py-3 rounded-lg border border-red-500/50 text-red-100 flex items-start gap-2 max-w-[250px]">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold mb-1">错误</p>
            <p>{error}</p>
          </div>
        </div>
      )}

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
        isModelLoaded && !error ? "opacity-100" : "opacity-0"
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
      {isModelLoaded && !error && (
        <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-[200px] text-xs text-gray-300 space-y-1">
          <p>🖐️ <b>张开手掌</b>: 散开</p>
          <p>✊ <b>握紧拳头</b>: 聚合(圣诞树)</p>
          <p>✌️ <b>V字手势</b>: 爱心</p>
        </div>
      )}
    </div>
  );
};