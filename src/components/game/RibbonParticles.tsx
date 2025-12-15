import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

type Mode = 'tree' | 'heart' | 'scatter';

interface RibbonParticlesProps {
  mode: Mode;
}

const COUNT = 600; // 彩带粒子数量
const TREE_HEIGHT = 10;
const TREE_RADIUS = 4.2; // 比树稍宽
const TURNS = 6; // 螺旋圈数

export const RibbonParticles: React.FC<RibbonParticlesProps> = ({ mode }) => {
  const points = useRef<THREE.Points>(null!);
  
  // 1. Tree Mode: Spiral Ribbon
  const treePos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT; // 0 -> 1 (bottom to top)
      
      const h = t * TREE_HEIGHT; 
      const r = (1 - t) * TREE_RADIUS; 
      const angle = t * Math.PI * 2 * TURNS;
      
      const x = r * Math.cos(angle);
      const y = h - TREE_HEIGHT / 2;
      const z = r * Math.sin(angle);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  // 2. Heart Mode: Outline of the heart
  const heartPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Create a continuous line around the heart shape
      const t = (i / COUNT) * Math.PI * 2; 
      
      // Heart formula
      const scale = 0.32; // Slightly larger than the tree heart (0.3)
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      const z = 0; // Flat ribbon for heart outline looks cleaner? Or slight spiral?
      
      // Let's make it a 3D tube/spiral around the heart outline effectively
      // Or just a clean outline
      
      pos[i * 3] = x * scale;
      pos[i * 3 + 1] = y * scale + 2; 
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  // 3. Scatter Mode: Random
  const scatterPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sphere = random.inSphere(new Float32Array(COUNT * 3), { radius: 12 });
    pos.set(sphere);
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
  const currentPos = useMemo(() => new Float32Array(treePos), [treePos]);
  const targetPosRef = useRef(treePos);

  useEffect(() => {
    if (mode === 'tree') targetPosRef.current = treePos;
    else if (mode === 'heart') targetPosRef.current = heartPos;
    else targetPosRef.current = scatterPos;
  }, [mode, treePos, heartPos, scatterPos]);

  useFrame((state, delta) => {
    const dampSpeed = 2.5; // Slightly faster than tree particles
    
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Lerp Position
      currentPos[ix] += (targetPosRef.current[ix] - currentPos[ix]) * dampSpeed * delta;
      currentPos[iy] += (targetPosRef.current[iy] - currentPos[iy]) * dampSpeed * delta;
      currentPos[iz] += (targetPosRef.current[iz] - currentPos[iz]) * dampSpeed * delta;

      // Add "flowing" animation effect along the ribbon in Tree mode
      if (mode === 'tree') {
        const time = state.clock.elapsedTime;
        // Small rotation of the whole ribbon logic could go here, or individual particle wobble
        // Let's make particles shimmer by moving slightly
        const wobble = Math.sin(time * 2 + i * 0.1) * 0.05;
        currentPos[iy] += wobble; 
      }
    }

    points.current.geometry.attributes.position.needsUpdate = true;
    
    // Rotate the whole group slowly for dynamic effect
    if (mode === 'tree') {
       points.current.rotation.y += delta * 0.2;
    } else {
       // Reset rotation or keep spinning? Keep spinning looks cool for scatter
       points.current.rotation.y += delta * 0.05;
    }
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
      {/* Larger, brighter particles for the ribbon */}
      <PointMaterial
        transparent
        vertexColors
        size={0.2} 
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false} 
      />
    </points>
  );
};
