// components/Visualizer.js
import React from 'react';

// This component displays a static 3D glassy sphere with two animating internal haze/gradients 
// that rotate in opposite directions.
const Visualizer = ({ isSpeaking }) => {
  const spinKeyframes = `
    /* Haze Layer 1: Clockwise Rotation */
    @keyframes internal-haze-spin-1 {
      from { transform: rotateY(0deg) rotateX(0deg); }
      to { transform: rotateY(360deg) rotateX(360deg); } 
    }
    /* Haze Layer 2: Anti-Clockwise (Opposite) Rotation */
    @keyframes internal-haze-spin-2 {
      /* 'reverse' property se animation ulta chalta hai, par yahan alag keyframe bana rahe hain */
      from { transform: rotateY(180deg) rotateX(180deg); }
      to { transform: rotateY(-360deg) rotateX(-360deg); } 
    }
    /* Haze Layer 3: Fast, Clockwise Rotation on Z and Y axis (New Keyframe) */
    @keyframes internal-haze-spin-3 {
      from { transform: rotateY(0deg); }
      to { transform: rotateY(360deg); }
    }
  `;

  return (
    <>
      <style>{spinKeyframes}</style>
      
      <div 
        className={`relative flex items-center justify-center w-40 h-40 my-8 ${isSpeaking ? '' : 'hidden'}`}
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
            // First Color: Pink to Purple gradient
            background: 'radial-gradient(circle at 60% 70%, #FF0077 0%, #7700FF 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.7, 
            
            // Animation 1: Clockwise, 20 seconds (Speed 1)
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
            // Second Color: Cyan to Blue gradient
            background: 'radial-gradient(circle at 40% 30%,rgb(205, 78, 156) 0%,rgb(0, 60, 255) 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.6, // Thoda kam opaque taaki pehli layer bhi dikhe
            
            // Animation 2: Anti-Clockwise, 30 seconds (Speed 2 - Slower)
            animation: 'internal-haze-spin-2 6s linear infinite', 
            animationPlayState: isSpeaking ? 'running' : 'paused',
            
            transformStyle: 'preserve-3d', 
            // Thoda alag position taaki dono layers alag-alag dikhe
            transform: 'scale(1.1) rotateX(180deg) translateZ(-8px)', 
            zIndex: 7, // Pehli layer se neeche
          }}
        />

        {/* 4. Inner Haze Layer 3 (Green/Yellow - Speed: 15s, Clockwise, ZIndex: 3) */}
        <div 
          className="absolute w-32 h-32 rounded-full" 
          style={{
            // **NEW COLOR/GRADIENT**
            background: 'radial-gradient(circle at 50% 50%,rgb(0, 140, 255) 0%,rgb(0, 150, 176) 50%, rgba(255, 255, 255, 0) 100%)', 
            opacity: 0.5, // Thoda aur transparent
            
            // **NEW ANIMATION/SPEED**
            animation: 'internal-haze-spin-3 12s linear infinite', // 15s (tez) aur 'reverse' use kiya
            animationPlayState: isSpeaking ? 'running' : 'paused',
            
            transformStyle: 'preserve-3d', 
            // Sabse peeche rakha
            transform: 'scale(1.1) rotateX(180deg) translateZ(-12px)', 
            zIndex: 6, // Sabse kam Z-index
          }}
        />
        
        {/* 4. Shadow/Glow below the sphere (Static) */}
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