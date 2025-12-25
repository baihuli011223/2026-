# Task: 3D 粒子圣诞树（固定样式版）

## Plan
- [x] Step 1: 分析现有代码与需求匹配度
  - [x] 确认现有代码包含 Tree 模式
  - [x] 决定移除多模式切换功能，锁定为单一 Tree 模式
- [x] Step 2: 清理不必要的依赖与功能
  - [x] 移除 @mediapipe/tasks-vision (手势控制)
  - [x] 移除 Babylon.js (使用现有 Three.js 架构)
  - [x] 删除 GestureController 组件
- [x] Step 3: 修改核心逻辑与 UI
  - [x] 修改 App.tsx 固定 mode="tree"
  - [x] 修改 UI.tsx 移除模式切换按钮与逻辑
  - [x] 保留音频控制与标题
- [x] Step 4: 验证与优化
  - [x] 运行 Lint 检查
  - [x] 确认代码无冗余报错

## Notes
- 已成功将多模态粒子系统转换为单一的静态（但在微观上动态）粒子圣诞树。
- 只有 Tree 模式和配套的 Ribbon 效果被激活。

