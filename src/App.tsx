import React, { useState } from 'react';
import { Scene } from './components/game/Scene';
import { UI } from './components/game/UI';
import { audioManager } from './lib/audio';

const App: React.FC = () => {
  const [mode, setMode] = useState<'tree' | 'heart' | 'scatter' | 'saturn' | 'flower'>('tree');
  // 0: Monet (Default)
  // 1: Neon (Cyberpunk)
  // 2: Red & Gold (Classic)
  // 3: Blue & White (Ice)
  const [themeIndex, setThemeIndex] = useState(0);

  const handleModeChange = (newMode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower') => {
    // 任何手势触发时，都切换主题
    // 忽略 newMode 的具体值，因为我们现在固定在 tree 模式
    // 如果用户真的想切换形状，我们可能需要另外的逻辑，但现在需求是 "手势切换样式" (Style/Theme)
    
    // 使用函数式更新确保状态正确
    setThemeIndex(prev => (prev + 1) % 4);
    
    // 如果之前不是 tree，强制切回 tree (双重保险)
    if (mode !== 'tree') {
      setMode('tree');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden selection:bg-emerald-500/30">
      <Scene mode={mode} themeIndex={themeIndex} />
      <UI currentMode={mode} setMode={handleModeChange} />
    </div>
  );
};

export default App;
