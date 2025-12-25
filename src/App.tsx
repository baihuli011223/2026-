import React, { useState } from 'react';
import { Scene } from './components/game/Scene';
import { UI } from './components/game/UI';
import { audioManager } from './lib/audio';

const App: React.FC = () => {
  const [mode, setMode] = useState<'tree' | 'heart' | 'scatter' | 'saturn' | 'flower'>('tree');

  const handleModeChange = (newMode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => {
    // 只有模式真正改变时才更新状态，避免重复渲染
    setMode((prevMode) => {
      if (prevMode === newMode) return prevMode;
      return newMode;
    });
    // 用户要求移除切换时的音效
    // audioManager.playEffect(newMode);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-emerald-500/30">
      <Scene mode={mode} />
      <UI currentMode={mode} setMode={handleModeChange} />
    </div>
  );
};

export default App;
