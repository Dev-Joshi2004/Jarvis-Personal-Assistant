// components/Visualizer.js (FIXED FOR SMOOTH TRANSITION)
import React from 'react';

const Visualizer = ({ isSpeaking }) => {
  const spinKeyframes = `
    /* Haze Layer 1: Clockwise Rotation */
    @keyframes internal-haze-spin-1 {
      from { transform: rotateY(0deg) rotateX(0deg); }
      to { transform: rotateY(360deg) rotateX(360deg); } 
    }
    /* Haze Layer 2: Anti-Clockwise (Opposite) Rotation */
    @keyframes internal-haze-spin-2 {
      from { transform: rotateY(180deg) rotateX(180deg); }
      to { transform: rotateY(-360deg) rotateX(-360deg); } 
    }
    /* Haze Layer 3: Fast, Clockwise Rotation on Y axis */
    @keyframes internal-haze-spin-3 {
      from { transform: rotateY(0deg); }
      to { transform: rotateY(360deg); }
    }
  `;
  
  return (
    <>
      <style>{spinKeyframes}</style>
      
      <div
        className={`relative flex items-center justify-center w-full h-full`}
        style={{ perspective: '1000px' }}
      >
        
        {/* 1. The STATIC Glassy Sphere Shell (Outer Body) */}
        <div 
          className="absolute w-35 h-35 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(5px) saturate(150%)',
            boxShadow: 'inset 0 0 50px rgba(255, 255, 255, 0.7), 0 0 15px rgba(0, 0, 0, 0.4)', 
            transformStyle: 'preserve-3d', 
            transform: 'rotateX(10deg) translateZ(0)', 
            zIndex: 10,
          }}
        />

        {/* 2. The Inner Haze Layer 1 (Pink/Purple - Faster, Clockwise) */}
        <div 
          className="absolute w-30 h-30 rounded-full" 
          style={{
            background: 'radial-gradient(circle at 60% 70%, #FF0077 0%, #7700FF 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.7, 
            animation: 'internal-haze-spin-1 6s linear infinite', 
            animationPlayState: isSpeaking ? 'running' : 'paused',
            transformStyle: 'preserve-3d', 
            transform: 'scale(1.1) rotateX(-180deg) translateZ(-5px)', 
            zIndex: 8, 
          }}
        />
        
        {/* 3. The Inner Haze Layer 2 (Cyan/Blue - Slower, Anti-Clockwise) */}
        <div 
          className="absolute w-30 h-30 rounded-full" 
          style={{
            background: 'radial-gradient(circle at 40% 30%,rgb(205, 78, 156) 0%,rgb(0, 60, 255) 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.6, 
            animation: 'internal-haze-spin-2 6s linear infinite', 
            animationPlayState: isSpeaking ? 'running' : 'paused',
            transformStyle: 'preserve-3d', 
            transform: 'scale(1.1) rotateX(180deg) translateZ(-8px)', 
            zIndex: 7, 
          }}
        />

        {/* 4. Inner Haze Layer 3 (Green/Yellow - Speed: 15s, Clockwise, ZIndex: 3) */}
        <div 
          className="absolute w-32 h-32 rounded-full" 
          style={{
            background: 'radial-gradient(circle at 50% 50%,rgb(0, 140, 255) 0%,rgb(0, 150, 176) 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.5, 
            animation: 'internal-haze-spin-3 12s linear infinite', 
            animationPlayState: isSpeaking ? 'running' : 'paused',
            transformStyle: 'preserve-3d', 
            transform: 'scale(1.1) rotateX(180deg) translateZ(-12px)', 
            zIndex: 6, 
          }}
        />
        
        {/* 5. Shadow/Glow below the sphere (Static) */}
        <div 
          className="absolute w-24 h-4 rounded-full bg-black/40"
          style={{
            filter: 'blur(12px)',
            bottom: '5px',
            animationPlayState: isSpeaking ? 'running' : 'paused'
          }}
        />
      </div>
    </>
  );
};

export default Visualizer;
