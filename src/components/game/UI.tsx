import React, { useState } from 'react';
import { TreePine, Heart, Move, Volume2, VolumeX, Play, Camera, CameraOff, Globe, Flower2 } from 'lucide-react';
import { audioManager } from '../../lib/audio';
import { cn } from '../../lib/utils';
import { GestureController } from './GestureController';

interface UIProps {
  currentMode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower';
  setMode: (mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => void;
}

export const UI: React.FC<UIProps> = ({ currentMode, setMode }) => {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);

  const handleStart = async () => {
    await audioManager.init();
    audioManager.playBGM();
    audioManager.setVolume(volume);
    setIsAudioStarted(true);
  };

  const handleModeChange = (mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => {
    if (mode === currentMode) return;
    setMode(mode);
    audioManager.playEffect(mode as any); // Type assertion if needed, but we'll update audioManager too
  };


  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0) setIsMuted(false);
    audioManager.setVolume(isMuted ? 0 : v);
  };

  const toggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioManager.setVolume(newMute ? 0 : volume);
  };

  if (!isAudioStarted) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 font-serif filter drop-shadow-lg">
            3D 粒子圣诞树
          </h1>
          <p className="text-emerald-100 text-lg">戴上耳机体验最佳沉浸式效果</p>
          <button
            onClick={handleStart}
            className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-full text-white font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.8)]"
          >
            <span className="flex items-center gap-2">
              <Play className="w-6 h-6 fill-current" /> 开启体验
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Title */}
      <div className="absolute top-8 left-8 z-40">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400 font-serif drop-shadow-md">
          Christmas Magic
        </h1>
        <p className="text-xs text-emerald-200/60 mt-1 tracking-widest">INTERACTIVE PARTICLE SYSTEM</p>
      </div>

      {/* Volume Control */}
      <div className="absolute top-8 right-8 z-40 flex items-center gap-3 bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10">
        <button 
          onClick={() => setIsCameraEnabled(!isCameraEnabled)} 
          className={cn(
            "p-2 rounded-full transition-all mr-2",
            isCameraEnabled ? "bg-emerald-600 text-white" : "bg-white/10 text-emerald-100 hover:text-white"
          )}
          title="开启/关闭手势控制"
        >
          {isCameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
        </button>

        <button onClick={toggleMute} className="text-emerald-100 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-emerald-900 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-125"
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 flex justify-center">
        <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-x-auto">
          <ControlButton
            isActive={currentMode === 'scatter'}
            onClick={() => handleModeChange('scatter')}
            icon={<Move size={24} />}
            label="散开"
          />
          <ControlButton
            isActive={currentMode === 'tree'}
            onClick={() => handleModeChange('tree')}
            icon={<TreePine size={24} />}
            label="聚合"
            isMain
          />
          <ControlButton
            isActive={currentMode === 'heart'}
            onClick={() => handleModeChange('heart')}
            icon={<Heart size={24} />}
            label="爱心"
          />
          <ControlButton
            isActive={currentMode === 'saturn'}
            onClick={() => handleModeChange('saturn')}
            icon={<Globe size={24} />}
            label="土星"
          />
          <ControlButton
            isActive={currentMode === 'flower'}
            onClick={() => handleModeChange('flower')}
            icon={<Flower2 size={24} />}
            label="花朵"
          />
        </div>
      </div>
      {/* Gesture Controller */}
      <GestureController 
        isEnabled={isCameraEnabled} 
        setIsEnabled={setIsCameraEnabled}
        onModeChange={handleModeChange} 
      />
    </>
  );
};

const ControlButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isMain?: boolean;
}> = ({ isActive, onClick, icon, label, isMain }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group flex flex-col items-center gap-2 transition-all duration-300",
        isActive ? "text-yellow-400 scale-110" : "text-emerald-100/60 hover:text-emerald-100 hover:scale-105"
      )}
    >
      <div
        className={cn(
          "p-4 rounded-xl transition-all duration-300 border",
          isActive 
            ? "bg-gradient-to-b from-emerald-800 to-emerald-900 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]" 
            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20",
            isMain && !isActive && "bg-emerald-900/40"
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-medium tracking-wide">{label}</span>
      
      {/* Active Indicator */}
      {isActive && (
        <span className="absolute -bottom-2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
      )}
    </button>
  );
};
