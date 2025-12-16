import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

type Mode = 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower';

interface TreeParticlesProps {
  mode: Mode;
}

const COUNT = 3000;
const TREE_HEIGHT = 10;
const TREE_RADIUS = 4;

export const TreeParticles: React.FC<TreeParticlesProps> = ({ mode }) => {
  const points = useRef<THREE.Points>(null!);
  
  // Generate different layouts
  const { positions: treePos, colors: treeColors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const cols = new Float32Array(COUNT * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      // 90% Tree body (Cone), 10% Trunk
      const isTrunk = i > COUNT * 0.9;
      
      let x, y, z;
      if (!isTrunk) {
        // Cone
        const h = Math.random() * TREE_HEIGHT; // 0 to 10
        const r = (1 - h / TREE_HEIGHT) * TREE_RADIUS * Math.sqrt(Math.random()); // Tapered radius
        const theta = Math.random() * Math.PI * 2;
        
        x = r * Math.cos(theta);
        y = h - TREE_HEIGHT / 2; // Center vertically
        z = r * Math.sin(theta);
        
        // Color: Emerald Green variants
        if (Math.random() > 0.9) {
            // Lights/Decorations
            const lightColors = ['#ff0000', '#ffd700', '#0000ff', '#ffffff', '#800080'];
            colorObj.set(lightColors[Math.floor(Math.random() * lightColors.length)]);
        } else {
            // Green leaves
            colorObj.setHSL(Math.random() * 0.1 + 0.35, 0.8, Math.random() * 0.4 + 0.1); // Green-ish
        }
      } else {
        // Trunk
        const h = Math.random() * (TREE_HEIGHT * 0.2);
        const r = Math.random() * 0.8;
        const theta = Math.random() * Math.PI * 2;
        
        x = r * Math.cos(theta);
        y = h - TREE_HEIGHT / 2 - (TREE_HEIGHT * 0.1); 
        z = r * Math.sin(theta);
        
        // Brown
        colorObj.setHSL(0.08, 0.6, 0.2 + Math.random() * 0.1);
      }

      // Add a star at top (last few particles)
      if (i < 50) {
        x = (Math.random() - 0.5) * 0.5;
        y = TREE_HEIGHT / 2 + Math.random() * 0.5;
        z = (Math.random() - 0.5) * 0.5;
        colorObj.set('#ffd700'); // Gold
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      cols[i * 3] = colorObj.r;
      cols[i * 3 + 1] = colorObj.g;
      cols[i * 3 + 2] = colorObj.b;
    }
    return { positions: pos, colors: cols };
  }, []);

  const heartPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      // Heart parametric
      // Scale down a bit to match tree size
      const scale = 0.3;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      // Add volume to Z
      const z = (Math.random() - 0.5) * 4; 
      
      // Randomize inside the shape slightly
      const rScale = Math.random();
      
      pos[i * 3] = x * scale * Math.sqrt(rScale);
      pos[i * 3 + 1] = y * scale * Math.sqrt(rScale) + 2; // Lift up a bit
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const saturnPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      let x, y, z;
      
      if (i < COUNT * 0.6) {
        // Planet Body (60%)
        const r = 2.5 * Math.cbrt(Math.random()); // Solid sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else {
        // Rings (40%)
        const angle = Math.random() * Math.PI * 2;
        // Ring radius between 3.5 and 6.0
        const dist = 3.5 + Math.random() * 2.5; 
        
        x = Math.cos(angle) * dist;
        y = (Math.random() - 0.5) * 0.1; // Very thin
        z = Math.sin(angle) * dist;
        
        // Tilt the ring (rotate around X axis by ~20 degrees)
        const tilt = 0.4; 
        const yOld = y;
        const zOld = z;
        y = yOld * Math.cos(tilt) - zOld * Math.sin(tilt);
        z = yOld * Math.sin(tilt) + zOld * Math.cos(tilt);
      }
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const flowerPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      let x, y, z;
      
      if (i < COUNT * 0.2) {
        // Center Stamen (20%)
        const r = 1.0 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else {
        // Petals (80%)
        const petalCount = 5;
        // Random angle around
        const t = Math.random() * Math.PI * 2;
        
        // Rose curve formula: r = cos(k * theta)
        // Adjust to make petals wider: cos(k*theta)^0.5 or similar
        // Here we create 5 distinct lobes
        const lobe = Math.abs(Math.cos((petalCount * t) / 2));
        
        // Radius distribution within the petal
        const rMax = 5.0;
        const r = (1.0 + (rMax - 1.0) * lobe) * Math.sqrt(Math.random());
        
        // Cup shape: bend up based on radius
        const height = r * 0.4;
        
        x = r * Math.cos(t);
        y = height + (Math.random() - 0.5) * 0.5;
        z = r * Math.sin(t);
        
        // Tilt the whole flower to face slightly forward/up
        const tilt = 0.5;
        const yOld = y;
        const zOld = z;
        y = yOld * Math.cos(tilt) - zOld * Math.sin(tilt);
        z = yOld * Math.sin(tilt) + zOld * Math.cos(tilt);
      }
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const scatterPos = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    // Random sphere
    const sphere = random.inSphere(new Float32Array(COUNT * 3), { radius: 10 });
    // maath returns Float32Array, copy it
    pos.set(sphere);
    return pos;
  }, []);

  // Buffers for animation
  const currentPos = useMemo(() => new Float32Array(treePos), [treePos]);
  const currentColors = useMemo(() => new Float32Array(treeColors), [treeColors]);
  
  // Ref to hold the target positions/colors
  const targetPosRef = useRef(treePos);
  const targetColorRef = useRef(treeColors);

  useEffect(() => {
    const c = new THREE.Color();
    const cols = new Float32Array(COUNT * 3);

    if (mode === 'tree') {
      targetPosRef.current = treePos;
      targetColorRef.current = treeColors;
    } else if (mode === 'heart') {
      targetPosRef.current = heartPos;
      // For heart, make them reddish/pink/gold
      for(let i=0; i<COUNT; i++) {
        if (Math.random() > 0.5) c.set('#ff0066'); // Pink
        else c.set('#ffcccc'); // Light pink
        // Keep some gold
        if (i < 50) c.set('#ffd700');

        cols[i*3] = c.r;
        cols[i*3+1] = c.g;
        cols[i*3+2] = c.b;
      }
      targetColorRef.current = cols;

    } else if (mode === 'saturn') {
      targetPosRef.current = saturnPos;
      // Saturn colors
      for(let i=0; i<COUNT; i++) {
        if (i < COUNT * 0.6) {
           // Body: Orange/Beige
           c.setHSL(0.08 + Math.random() * 0.05, 0.8, 0.5);
        } else {
           // Rings: Gold/White/Dusty
           if (Math.random() > 0.5) c.set('#ffd700');
           else c.set('#a0a0a0');
        }
        cols[i*3] = c.r;
        cols[i*3+1] = c.g;
        cols[i*3+2] = c.b;
      }
      targetColorRef.current = cols;
    
    } else if (mode === 'flower') {
      targetPosRef.current = flowerPos;
      // Flower colors
      for(let i=0; i<COUNT; i++) {
        if (i < COUNT * 0.2) {
           // Center: Yellow/Gold
           c.set('#ffaa00');
        } else {
           // Petals: Purple/Pink/Magenta
           c.setHSL(0.8 + Math.random() * 0.1, 0.8, 0.6);
        }
        cols[i*3] = c.r;
        cols[i*3+1] = c.g;
        cols[i*3+2] = c.b;
      }
      targetColorRef.current = cols;

    } else if (mode === 'scatter') {
      targetPosRef.current = scatterPos;
      // Keep previous colors or random? Let's keep tree colors for scatter but maybe brighter
      targetColorRef.current = treeColors; 
    }
  }, [mode, treePos, heartPos, scatterPos, saturnPos, flowerPos, treeColors]);

  useFrame((state, delta) => {
    // Interpolate positions
    const dampSpeed = 2;
    
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Position lerp
      currentPos[ix] += (targetPosRef.current[ix] - currentPos[ix]) * dampSpeed * delta;
      currentPos[iy] += (targetPosRef.current[iy] - currentPos[iy]) * dampSpeed * delta;
      currentPos[iz] += (targetPosRef.current[iz] - currentPos[iz]) * dampSpeed * delta;
      
      // Color lerp
      currentColors[ix] += (targetColorRef.current[ix] - currentColors[ix]) * dampSpeed * delta;
      currentColors[iy] += (targetColorRef.current[iy] - currentColors[iy]) * dampSpeed * delta;
      currentColors[iz] += (targetColorRef.current[iz] - currentColors[iz]) * dampSpeed * delta;

      // Add some gentle wave/noise movement if in tree mode
      if (mode === 'tree') {
        const time = state.clock.elapsedTime;
        currentPos[ix] += Math.sin(time + currentPos[iy]) * 0.002;
      }
    }

    // Update geometry
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.color.needsUpdate = true;
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
          array={currentColors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
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
