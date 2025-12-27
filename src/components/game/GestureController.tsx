import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GestureControllerProps {
  onModeChange: (mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower' | 'dna' | 'sphere') => void;
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
        
        // Map gestures to modes
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
        } else if (category === 'ILoveYou') {
          onModeChangeRef.current('dna');
        } else if (category === 'Thumb_Down') {
          onModeChangeRef.current('sphere');
        }
      }
    } else {
      // Don't clear immediately to avoid flickering text?
      // setDetectedGesture(''); 
      // Actually clearing is fine for UI feedback
      setDetectedGesture('');
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-10 duration-500">
      {/* Error State */}
      {error && (
        <div className="bg-red-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-red-500/50 text-red-100 flex items-start gap-2 max-w-[200px]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-[10px]">
            <p className="font-bold mb-0.5">错误</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isModelLoading && (
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-emerald-100 flex items-center gap-2">
          <Loader2 className="animate-spin w-3 h-3" />
          <span className="text-[10px]">加载模型...</span>
        </div>
      )}

      {/* Video Preview - Miniaturized */}
      <div className={cn(
        "relative w-24 h-24 bg-black/50 rounded-lg overflow-hidden border border-white/10 shadow-lg transition-all hover:scale-150 origin-bottom-right group", // Default very small, hover to enlarge
        isModelLoaded && !error ? "opacity-100" : "opacity-0"
      )}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100 opacity-80 group-hover:opacity-100 transition-opacity" // Slightly transparent by default
        />
        
        {/* Gesture Indicator overlay - Compact */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] p-1 text-center">
          <span className="text-[10px] font-mono text-emerald-400 font-bold block truncate">
            {detectedGesture ? detectedGesture : "等待手势"}
          </span>
        </div>
      </div>

      {/* Helper Text - Fixed Bottom Left Panel */}
      {isModelLoaded && !error && (
        <div className="fixed bottom-8 left-8 z-50 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs text-emerald-100/90 shadow-2xl transition-all duration-500 hover:bg-black/60">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-emerald-400 mb-1 border-b border-white/10 pb-1">手势控制指南</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
               <span className="flex items-center gap-2"><span className="text-lg">👋</span> 张开手掌: <span className="text-gray-300">粒子打散</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">✊</span> 握紧拳头: <span className="text-gray-300">2026文字</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">✌️</span> 胜利手势: <span className="text-gray-300">爱心形状</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">👍</span> 竖大拇指: <span className="text-gray-300">土星环绕</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">☝️</span> 食指指天: <span className="text-gray-300">盛开花朵</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">🤟</span> 爱你手势: <span className="text-gray-300">DNA螺旋</span></span>
               <span className="flex items-center gap-2"><span className="text-lg">👎</span> 拇指向下: <span className="text-gray-300">黄金球体</span></span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic text-center">请保持手部在摄像头画面中央</p>
          </div>
        </div>
      )}
    </div>
  );
};