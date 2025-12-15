# Task: 3D 粒子圣诞树游戏开发

## Plan
- [ ] Step 1: 环境配置与依赖安装
  - [ ] 安装 three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, maath, tone
  - [ ] 创建基础目录结构
- [ ] Step 2: 音频系统实现 (Tone.js)
  - [ ] 创建 AudioContext 管理器
  - [ ] 实现背景音乐 (Ambient Pad)
  - [ ] 实现交互音效 (Chimes/Sparkles)
- [ ] Step 3: 3D 场景基础搭建
  - [ ] 配置 Canvas, Camera, OrbitControls
  - [ ] 添加环境光与辉光效果 (Bloom)
  - [ ] 实现背景飘雪效果 (Snow)
- [ ] Step 4: 粒子系统核心逻辑
  - [ ] 实现粒子位置生成算法 (Tree, Heart, Explode)
  - [ ] 实现粒子组件 (Points) 与 材质 (Shader/Sprite)
  - [ ] 实现状态切换与动画插值 (maath)
- [ ] Step 5: UI 交互层开发
  - [ ] 实现控制按钮 (散开、聚合、爱心)
  - [ ] 实现音量控制滑块
  - [ ] 美化界面 (Tailwind CSS, Shadcn)
  - [ ] Step 3.5: 实现彩带粒子系统 (Ribbon)
    - [ ] 创建 RibbonParticles 组件
    - [ ] 实现螺旋算法 (Tree模式) 与 轮廓算法 (Heart模式)
    - [ ] 整合进 Scene 场景
- [ ] Step 6: 整合与优化
  - [ ] 调整粒子颜色、大小、光效
  - [ ] 优化性能与交互体验
  - [ ] 最终测试

## Notes
- 粒子数量控制在 3000 以内以保证流畅度。
- 使用 Tone.js 合成音效，避免外部资源依赖问题。
- 确保 Bloom 效果不会过度曝光。
