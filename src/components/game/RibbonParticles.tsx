import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

type Mode = 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower';

interface RibbonParticlesProps {
  mode: Mode;
}

const COUNT = 600; // 彩带粒子数量
const TREE_HEIGHT = 10;
const TREE_RADIUS = 4.2; // 比树稍宽
const TURNS = 6; // 螺旋圈数

export const RibbonParticles: React.FC<RibbonParticlesProps> = ({ mode }) => {
  const points = useRef<THREE.Points>(null!);
  
  // Mobius Strip Parameters
  const RADIUS = 7;
  const WIDTH = 3;
  
  // 1. Mobius Strip Logic
  const mobiusPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Distribute particles along the strip
      // u: angle around the ring [0, 2PI]
      // v: width across the strip [-WIDTH/2, WIDTH/2]
      
      const u = (i / COUNT) * Math.PI * 2;
      const v = (Math.random() - 0.5) * WIDTH;
      
      // Mobius Strip Parametric Equations (Oriented horizontally)
      // Standard Mobius: 
      // x = (R + v * cos(u/2)) * cos(u)
      // y = (R + v * cos(u/2)) * sin(u)
      // z = v * sin(u/2)
      
      // We swap y and z to make it horizontal (flat on XZ plane), then tilt it?
      // Actually let's just keep standard and rotate the whole mesh in useFrame
      
      const R = RADIUS;
      
      // Calculate base position
      const x = (R + v * Math.cos(u/2)) * Math.cos(u);
      const z = (R + v * Math.cos(u/2)) * Math.sin(u);
      const y = v * Math.sin(u/2);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);
  // Colors - Always Gold/Glowing
  const colors = useMemo(() => {
    const cols = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      // Gold/Orange gradient
      c.setHSL(0.1 + Math.random() * 0.05, 1, 0.6 + Math.random() * 0.4);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return cols;
  }, []);

  // Animation Buffers
  // Store initial "u" and "v" for each particle to re-calculate positions in animation loop
  const particleParams = useMemo(() => {
    const params = new Float32Array(COUNT * 2); // u, v
    for(let i=0; i<COUNT; i++) {
        params[i*2] = (i / COUNT) * Math.PI * 2; // u
        params[i*2+1] = (Math.random() - 0.5) * WIDTH; // v
    }
    return params;
  }, []);

  const currentPos = useMemo(() => new Float32Array(mobiusPos), [mobiusPos]);
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Rotate the entire group slowly - Clockwise (Negative)
    // 顺时针匀速旋转，无晃动
    points.current.rotation.y = -time * 0.1;
    // 固定倾斜角度，不再摆动
    points.current.rotation.z = 0.2; 

    // Animate particles flowing along the Mobius strip
    // We recalculate positions based on updated 'u'
    
    // 匀速流动，移除律动
    const baseSpeed = 0.15; 

    const R = RADIUS;

    for (let i = 0; i < COUNT; i++) {
      // 线性运动
      let u = particleParams[i*2] + time * baseSpeed; 
      const v = particleParams[i*2+1];
      
      // Mobius Parametric Calculation
      // x = (R + v * cos(u/2)) * cos(u)
      // y = v * sin(u/2)
      // z = (R + v * cos(u/2)) * sin(u)
      // To make it lie flat on XZ plane: swap y and z components relative to standard mobius
      // Standard Mobius (u=[0,2PI], v=[-w,w]):
      // x = (R + v*cos(u/2)) * cos(u)
      // y = (R + v*cos(u/2)) * sin(u)
      // z = v*sin(u/2)
      
      // We want the ring to encircle the tree (which is along Y axis).
      // So the main ring should be in X-Z.
      // x = (R + v*cos(u/2)) * cos(u)
      // z = (R + v*cos(u/2)) * sin(u)
      // y = v*sin(u/2)
      
      const x = (R + v * Math.cos(u/2)) * Math.cos(u);
      const z = (R + v * Math.cos(u/2)) * Math.sin(u);
      const y = v * Math.sin(u/2);
      
      // Add falling effect? 
      // User asked for "infinite Mobius loop" + "stars falling"
      // Maybe add a slight offset in Y that loops?
      // Actually, flowing ALONG the Mobius strip IS the infinite loop effect.
      // Let's add some "sparkle" jitter
      
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
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
