import React, { useState } from 'react';
import { Scene } from './components/game/Scene';
import { UI } from './components/game/UI';

const App: React.FC = () => {
  const [mode, setMode] = useState<'tree' | 'heart' | 'scatter' | 'saturn' | 'flower'>('tree');

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-emerald-500/30">
      <Scene mode={mode} />
      <UI currentMode={mode} setMode={setMode} />
    </div>
  );
};

export default App;
