import React, { useState } from 'react';
import { Scene } from './components/game/Scene';
import { UI } from './components/game/UI';
import { audioManager } from './lib/audio';

const App: React.FC = () => {
  const [mode, setMode] = useState<'tree' | 'heart' | 'scatter' | 'saturn' | 'flower'>('tree');

  const handleModeChange = (newMode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => {
    setMode(newMode);
    audioManager.playEffect(newMode);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-emerald-500/30">
      <Scene mode={mode} />
      <UI currentMode={mode} setMode={handleModeChange} />
    </div>
  );
};

export default App;
