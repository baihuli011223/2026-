import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

type Mode = 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower' | 'dna' | 'sphere';

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
  const RADIUS = 3.2; 
  const WIDTH = 0.4;
  
  // 1. Scatter Positions (Random Sphere)
  const scatterPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sphere = random.inSphere(new Float32Array(COUNT * 3), { radius: 20 });
    pos.set(sphere);
    return pos;
  }, []);

  // 2. Colors - 纯粹银白色 (Pure Silver White)
  const colors = useMemo(() => {
    const cols = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      if (r > 0.8) {
          c.set('#FFFFFF');
      } else {
          c.setHSL(0.61, 0.05, 0.85 + Math.random() * 0.1);
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

  // Current Positions (State)
  const currentPos = useMemo(() => new Float32Array(COUNT * 3), []);
  // Target Positions (Buffer)
  const targetPos = useMemo(() => new Float32Array(COUNT * 3), []);
  
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Rotate the entire group slowly
    points.current.rotation.y = -time * 0.1;
    points.current.rotation.z = 0; 

    // Calculate Target Positions
    if (mode === 'tree') {
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
            
            // Mobius Parametric
            let x = (R + v * Math.cos(u/2)) * Math.cos(u);
            let z = (R + v * Math.cos(u/2)) * Math.sin(u);
            let y = v * Math.sin(u/2);
            
            // Apply Tilt
            const yRot = y * Math.cos(currentTilt) - z * Math.sin(currentTilt);
            const zRot = y * Math.sin(currentTilt) + z * Math.cos(currentTilt);
            y = yRot;
            z = zRot;

            targetPos[i * 3] = x;
            targetPos[i * 3 + 1] = y;
            targetPos[i * 3 + 2] = z;
        }
    } else {
        // For all other modes (scatter, heart, etc.), scatter the ribbon particles
        // so they don't interfere with the main shape, acting as background dust
        for (let i = 0; i < COUNT; i++) {
            targetPos[i * 3] = scatterPos[i * 3];
            targetPos[i * 3 + 1] = scatterPos[i * 3 + 1];
            targetPos[i * 3 + 2] = scatterPos[i * 3 + 2];
        }
    }

    // Lerp currentPos -> targetPos
    const dampSpeed = 3; // Fast transition
    for (let i = 0; i < COUNT * 3; i++) {
        currentPos[i] += (targetPos[i] - currentPos[i]) * dampSpeed * delta;
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
      <PointMaterial
        ref={materialRef}
        transparent
        vertexColors
        size={0.15} 
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
        opacity={0.8}
      />
    </points>
  );
};