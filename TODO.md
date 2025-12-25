# Task: 3D 粒子圣诞树（固定样式版 + 手势控制）

## Plan
- [x] Step 1: 恢复手势控制依赖与组件
  - [x] 安装 @mediapipe/tasks-vision
  - [x] 创建 GestureController.tsx
  - [x] 恢复 MediaPipe 模型加载与识别逻辑
- [x] Step 2: 集成手势到 UI
  - [x] 修改 App.tsx 恢复 mode 状态管理
  - [x] 修改 UI.tsx 添加摄像头开关
  - [x] 连接手势回调与 mode 切换
- [x] Step 3: 优化体验
  - [x] 确保音频流畅
  - [x] 确保粒子特效（阶梯树、莫比乌斯环）正常

## Notes
- 用户要求恢复手势控制，特别是“散开”和“聚合”。
- 之前移除的代码逻辑大部分可以复用。
- 摄像头权限处理需要注意。


