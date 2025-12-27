import React, { useEffect, useRef, useState } from 'react';
import { GestureRecognizer, FilesetResolver, GestureRecognizerResult } from '@mediapipe/tasks-vision';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GestureControllerProps {
  onModeChange: (mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower' | 'dna' | 'sphere') => void;
  currentMode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower' | 'dna' | 'sphere';
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onModeChange, currentMode, isEnabled, setIsEnabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string>('');
  const [error, setError] = useState<string>('');
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const rafId = useRef<number | null>(null);
  const lastVideoTime = useRef<number>(-1);
  const streamRef = useRef<MediaStream | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const predictionInterval = 200; // 限制检测频率为每200ms一次 (5fps)，解决卡顿问题
  
    // Use ref to keep track of the latest callback and currentMode without triggering effect re-run
    const propsRef = useRef({ onModeChange, currentMode });
    useEffect(() => {
      propsRef.current = { onModeChange, currentMode };
    }, [onModeChange, currentMode]);

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
          numHands: 2, // 启用双手检测
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
            facingMode: 'user'
            // 移除硬编码的分辨率限制，提高手机兼容性
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

    const now = Date.now();
    // 节流控制：只有距离上次检测超过 predictionInterval 才执行
    if (now - lastPredictionTime.current >= predictionInterval) {
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        lastPredictionTime.current = now;
        
        try {
          const results = recognizerRef.current.recognizeForVideo(video, now);
          processResults(results);
        } catch (e) {
          console.error("手势识别错误:", e);
        }
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
      // 优先检测双手组合手势
      if (results.gestures.length === 2) {
        const gesture1 = results.gestures[0][0].categoryName;
        const gesture2 = results.gestures[1][0].categoryName;
        const score1 = results.gestures[0][0].score;
        const score2 = results.gestures[1][0].score;

        // 双手指天 -> DNA
        if (score1 > 0.6 && score2 > 0.6 && 
            gesture1 === 'Pointing_Up' && gesture2 === 'Pointing_Up') {
          setDetectedGesture('Dual_Point');
          const { onModeChange } = propsRef.current;
          onModeChange('dna');
          return; // 优先处理双手，不再处理单手
        }
      }

      // 单手逻辑 (或者双手但不满足特定组合时，取置信度最高的手势)
      // 找出置信度最高的手势
      let bestGesture = results.gestures[0][0];
      for (let i = 1; i < results.gestures.length; i++) {
        if (results.gestures[i][0].score > bestGesture.score) {
          bestGesture = results.gestures[i][0];
        }
      }

      const category = bestGesture.categoryName;
      const score = bestGesture.score;

      if (score > 0.6) {
        setDetectedGesture(category);
        
        const { onModeChange } = propsRef.current;

        // Map gestures to modes
        if (category === 'Open_Palm') {
          onModeChange('scatter');
        } else if (category === 'Closed_Fist') {
          onModeChange('tree');
        } else if (category === 'Victory') {
          onModeChange('heart');
        } else if (category === 'Pointing_Up') {
          onModeChange('flower'); // 恢复为只触发花朵
        } else if (category === 'ILoveYou') {
          onModeChange('saturn');
        } else if (category === 'Thumb_Down') {
          onModeChange('sphere');
        }
        // Removed Thumb_Up completely
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

      {/* Helper Text - Minimalist & Compact */}
      {isModelLoaded && !error && (
        <div className="fixed bottom-4 left-4 z-50 text-emerald-100/70 transition-opacity duration-500 select-none pointer-events-none origin-bottom-left scale-[0.6] sm:scale-100">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-xs text-emerald-500/50 mb-0.5 uppercase tracking-widest hidden sm:block">Gesture Guide</h3>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] font-mono">
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">👋</span> <span>打散</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">✊</span> <span>2026</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">✌️</span> <span>爱心</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">🤟</span> <span>土星</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">☝️</span> <span>花朵</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">☝️☝️</span> <span>DNA</span></span>
               <span className="flex items-center gap-1.5 whitespace-nowrap"><span className="text-sm grayscale opacity-70">👎</span> <span>球体</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};