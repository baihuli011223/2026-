import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { RibbonParticles } from './RibbonParticles';
import { Snow } from './Snow';

interface SceneProps {
  mode: 'tree' | 'heart' | 'scatter' | 'saturn' | 'flower' | 'dna' | 'sphere';
}

export const Scene: React.FC<SceneProps> = ({ mode }) => {
  return (
    <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
      <color attach="background" args={['#000500']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#fbbf24" />
      
      {/* Stars Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Particles */}
      <TreeParticles mode={mode} />
      <RibbonParticles mode={mode} />
      <Snow />

      {/* Post Processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.5} 
          luminanceSmoothing={0.9} 
          height={300} 
          intensity={1.5} 
        />
      </EffectComposer>

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={30} 
        autoRotate={mode === 'tree' || mode === 'saturn'}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
};
