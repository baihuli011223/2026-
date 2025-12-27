import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

type Mode = 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower';

interface RibbonParticlesProps {
  mode: Mode;
}

const COUNT = 1200; // 增加粒子数量以支持双环
const TREE_HEIGHT = 10;
const TREE_RADIUS = 4.2; 
const TURNS = 6; 

export const RibbonParticles: React.FC<RibbonParticlesProps> = ({ mode }) => {
  const points = useRef<THREE.Points>(null!);
  
  // Mobius Strip Parameters
  // 调整说明：
  // 1. 半径缩小到 3.2 (文字大约宽4，半径3.2直径6.4，留有余地)
  // 2. 宽度 0.4
  // 3. 倾角 25度 (稍扁平，避免遮挡太多)
  const RADIUS = 3.2; 
  const WIDTH = 0.4;
  
  // 1. Mobius Strip Logic
  const mobiusPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const half = COUNT / 2;
    
    // TILT ANGLES for the two rings (forming an X shape)
    // 两个环分别倾斜，形成 X 型交叉
    const tilt1 = 25 * (Math.PI / 180); 
    const tilt2 = -25 * (Math.PI / 180);

    for (let i = 0; i < COUNT; i++) {
      // Determine which ring this particle belongs to
      const isRing2 = i >= half;
      const currentTilt = isRing2 ? tilt2 : tilt1;
      
      // Normalized index for the ring
      const ringIndex = isRing2 ? i - half : i;
      const ringCount = half;

      const u = (ringIndex / ringCount) * Math.PI * 2;
      const v = (Math.random() - 0.5) * WIDTH;
      
      const R = RADIUS;
      
      // Base Mobius (XZ plane)
      let x = (R + v * Math.cos(u/2)) * Math.cos(u);
      let z = (R + v * Math.cos(u/2)) * Math.sin(u);
      let y = v * Math.sin(u/2);
      
      // Apply Tilt Rotation around X axis
      // y' = y*cos(t) - z*sin(t)
      // z' = y*sin(t) + z*cos(t)
      const yRot = y * Math.cos(currentTilt) - z * Math.sin(currentTilt);
      const zRot = y * Math.sin(currentTilt) + z * Math.cos(currentTilt);
      y = yRot;
      z = zRot;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  // Colors - 心理学配色：幻彩银 (Iridescent Silver)
  // 象征未来的无限可能与纯洁的开始
  // 在银白基调中融入微弱的淡紫与香槟色，增加梦幻感与高级感
  const colors = useMemo(() => {
    const cols = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    const half = COUNT / 2;
    
    for (let i = 0; i < COUNT; i++) {
      const isRing2 = i >= half;
      const ringIndex = isRing2 ? i - half : i;
      const ringCount = half;
      // 归一化位置 0-1
      const ratio = ringIndex / ringCount; 
      
      // 基础：高亮银白
      // 变化：根据位置泛出不同的光泽
      
      // H: 0.6(Blue) -> 0.75(Purple) -> 0.1(Warm Gold) 循环
      // S: 极低饱和度 (0.1 - 0.2)，保持银色质感
      // L: 高亮度 (0.8 - 0.95)
      
      const hue = 0.6 + Math.sin(ratio * Math.PI * 2) * 0.2; // 在蓝紫之间浮动
      
      if (Math.random() > 0.7) {
         // 香槟金光泽点缀 (Warmth)
         c.setHSL(0.1, 0.3, 0.9);
      } else {
         // 冷调银白/淡蓝紫 (Cool Elegance)
         c.setHSL(hue, 0.15, 0.85 + Math.random() * 0.15);
      }
      
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, []);

  // Animation Buffers
  const particleParams = useMemo(() => {
    const params = new Float32Array(COUNT * 2); // u, v
    const half = COUNT / 2;
    for(let i=0; i<COUNT; i++) {
        const isRing2 = i >= half;
        const ringIndex = isRing2 ? i - half : i;
        const ringCount = half;
        
        params[i*2] = (ringIndex / ringCount) * Math.PI * 2; // u
        params[i*2+1] = (Math.random() - 0.5) * WIDTH; // v
    }
    return params;
  }, []);

  const currentPos = useMemo(() => new Float32Array(mobiusPos), [mobiusPos]);
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Rotate the entire group slowly - Clockwise (Negative)
    // 顺时针匀速旋转
    points.current.rotation.y = -time * 0.1;
    // 移除固定倾斜，因为我们已经在粒子坐标里内置了 X 型交叉倾斜
    points.current.rotation.z = 0; 

    // Animate particles flowing along the Mobius strip
    const baseSpeed = 0.15; 
    const R = RADIUS;
    
    const tilt1 = 25 * (Math.PI / 180); 
    const tilt2 = -25 * (Math.PI / 180);
    const half = COUNT / 2;

    for (let i = 0; i < COUNT; i++) {
      let u = particleParams[i*2] + time * baseSpeed; 
      const v = particleParams[i*2+1];
      
      const isRing2 = i >= half;
      const currentTilt = isRing2 ? tilt2 : tilt1;
      
      // Mobius Parametric Calculation (XZ plane base)
      let x = (R + v * Math.cos(u/2)) * Math.cos(u);
      let z = (R + v * Math.cos(u/2)) * Math.sin(u);
      let y = v * Math.sin(u/2);
      
      // Apply Tilt Rotation around X axis
      const yRot = y * Math.cos(currentTilt) - z * Math.sin(currentTilt);
      const zRot = y * Math.sin(currentTilt) + z * Math.cos(currentTilt);
      y = yRot;
      z = zRot;

      currentPos[i * 3] = x;
      currentPos[i * 3 + 1] = y;
      currentPos[i * 3 + 2] = z;
    }

    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={currentPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      {/* Star texture or just points */}
      <PointMaterial
        ref={materialRef}
        transparent
        vertexColors
        size={0.15} 
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.NormalBlending} // 改为 NormalBlending，展示真实颜色
        opacity={0.8} // 降低透明度，避免抢眼
      />
    </points>
  );
};