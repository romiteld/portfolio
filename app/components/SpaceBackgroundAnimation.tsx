import React, { useEffect, useRef, useState } from 'react';

/**
 * SpaceBackgroundAnimation
 * 
 * A responsive space-themed background animation:
 * - Adapts element positions for mobile screens
 * - Optimizes SVG filters for better performance on mobile
 * - Repositions planets and spacecraft based on screen size
 * - Uses responsive scaling for visual elements
 */

const SpaceBackgroundAnimation: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Function to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    handleResize();

    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate responsive scaling factor
  const isMobile = windowWidth < 768;
  
  // Adjust moon and planet positions based on screen size
  // For mobile: Move moon more to center, bring orange planet in, center spacecraft
  const moonTransform = isMobile ? "translate(10, 50)" : "translate(-70, -50)";
  const orangePlanetTransform = isMobile ? "translate(-15, 20)" : "translate(80, 20)"; 
  const spacecraftTransform = isMobile ? "translate(150, 290) scale(0.3)" : "translate(200, 173) scale(0.4)";
  
  return (
    <div 
      className="fixed inset-0 -z-10 overflow-visible w-full h-full pointer-events-none"
      style={{ 
        backgroundColor: 'transparent',
        isolation: 'isolate'
      }}
    >
      <svg 
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg" 
        viewBox={isMobile ? "-20 -20 340 440" : "-20 -20 440 440"} 
        className="absolute inset-[-5px] w-[calc(100%+10px)] h-[calc(100%+10px)] border-0 outline-none shadow-none" 
        style={{ 
          display: 'block', 
          margin: 0, 
          padding: 0,
          boxShadow: 'none',
          backgroundClip: 'content-box',
          overflow: 'visible'
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Enhanced definitions for more realistic effects */}
        <defs>
          {/* Deep space background with multiple gradients - MATCHED TO PAGE BACKGROUND */}
          <radialGradient id="spaceGradient" cx="50%" cy="50%" r="100%" fx="40%" fy="30%">
            <stop offset="0%" stopColor="#13102b" />
            <stop offset="40%" stopColor="#0f0b24" />
            <stop offset="70%" stopColor="#0b081c" />
            <stop offset="100%" stopColor="#080619" />
          </radialGradient>
          
          {/* Cosmic dust and nebula effects */}
          <filter id="cosmicDust" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency={isMobile ? "0.01" : "0.008"} numOctaves={isMobile ? "4" : "5"} seed="5" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.03 0 0 0 0 0.15 0 0 0 0.5 0" result="coloredNoise" />
            <feGaussianBlur stdDeviation={isMobile ? "2" : "3"} result="blurredNoise" />
            <feBlend in="SourceGraphic" in2="blurredNoise" mode="screen" />
          </filter>
          
          <filter id="purpleNebula" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency={isMobile ? "0.006" : "0.005"} numOctaves={isMobile ? "3" : "4"} seed="10" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.2 0 0 0 0 0 0 0 0 0 0.3 0 0 0 0.15 0" result="purpleNoise" />
            <feGaussianBlur stdDeviation={isMobile ? "4" : "5"} result="blurredNoise" />
            <feBlend in="SourceGraphic" in2="blurredNoise" mode="screen" />
          </filter>
          
          {/* Enhanced planet textures */}
          <radialGradient id="bluePlanetGradient" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#7995ff" />
            <stop offset="30%" stopColor="#4a6aef" />
            <stop offset="60%" stopColor="#2a4adf" />
            <stop offset="85%" stopColor="#1a2abb" />
            <stop offset="100%" stopColor="#101a88" />
          </radialGradient>
          
          <linearGradient id="bluePlanetShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000018" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#000018" stopOpacity="0" />
          </linearGradient>
          
          <radialGradient id="orangePlanetGradient" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffdb99" />
            <stop offset="20%" stopColor="#ffb259" />
            <stop offset="50%" stopColor="#ff8c33" />
            <stop offset="80%" stopColor="#cc5500" />
            <stop offset="100%" stopColor="#992200" />
          </radialGradient>
          
          <linearGradient id="orangePlanetShadow" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#330500" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#330500" stopOpacity="0" />
          </linearGradient>
          
          {/* Dynamic planet gradient */}
          <radialGradient id="dynamicOrangePlanetGradient" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffdb99">
              <animate attributeName="stopColor" values="#ffdb99;#ffe6b3;#ffdb99" dur="20s" repeatCount="indefinite" />
            </stop>
            <stop offset="20%" stopColor="#ffb259">
              <animate attributeName="stopColor" values="#ffb259;#ffc073;#ffb259" dur="25s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#ff8c33">
              <animate attributeName="stopColor" values="#ff8c33;#ff9a4d;#ff8c33" dur="30s" repeatCount="indefinite" />
            </stop>
            <stop offset="80%" stopColor="#cc5500">
              <animate attributeName="stopColor" values="#cc5500;#dd6600;#cc5500" dur="35s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#992200">
              <animate attributeName="stopColor" values="#992200;#aa3300;#992200" dur="40s" repeatCount="indefinite" />
            </stop>
            
            {/* Gradient center movement */}
            <animate attributeName="cx" values="35%;40%;35%" dur="25s" repeatCount="indefinite" />
            <animate attributeName="cy" values="35%;30%;35%" dur="30s" repeatCount="indefinite" />
          </radialGradient>
          
          {/* Moon lighting */}
          <radialGradient id="radialLight" cx="30%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            
            {/* Gradient center slowly moves to create shifting light effect */}
            <animate attributeName="cx" values="30%;40%;30%" dur="60s" repeatCount="indefinite" />
            <animate attributeName="cy" values="30%;35%;30%" dur="70s" repeatCount="indefinite" />
          </radialGradient>
          
          {/* Moon shadow gradient */}
          <linearGradient id="moonShadow" x1="30%" y1="30%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0">
              <animate attributeName="stopOpacity" values="0;0.1;0" dur="20s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8">
              <animate attributeName="stopOpacity" values="0.8;0.7;0.8" dur="25s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          {/* Moon surface gradient with animation */}
          <radialGradient id="moonSurface" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff">
              <animate attributeName="stopColor" values="#ffffff;#f8f8f8;#ffffff" dur="15s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#e6e6e6">
              <animate attributeName="stopColor" values="#e6e6e6;#e0e0e0;#e6e6e6" dur="20s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#d1d1d1">
              <animate attributeName="stopColor" values="#d1d1d1;#c8c8c8;#d1d1d1" dur="25s" repeatCount="indefinite" />
            </stop>
            
            {/* Gradient center movement */}
            <animate attributeName="cx" values="30%;35%;30%" dur="30s" repeatCount="indefinite" />
            <animate attributeName="cy" values="30%;25%;30%" dur="40s" repeatCount="indefinite" />
          </radialGradient>
          
          {/* Advanced glow effects */}
          <filter id="starGlow" x="-300%" y="-300%" width="600%" height="600%">
            <feGaussianBlur stdDeviation="0.6" result="blur1" />
            <feGaussianBlur stdDeviation="1.2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="brightStarGlow" x="-500%" y="-500%" width="1000%" height="1000%">
            <feGaussianBlur stdDeviation="1" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feGaussianBlur stdDeviation="4" result="blur3" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="rocketEngineGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Metal textures */}
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e0e0e0" />
            <stop offset="50%" stopColor="#c0c0c0" />
            <stop offset="70%" stopColor="#a0a0a0" />
            <stop offset="100%" stopColor="#808080" />
          </linearGradient>
          
          {/* Lens flare effect */}
          <radialGradient id="lensFlare" cx="100%" cy="0%" r="150%" fx="90%" fy="10%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="20%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Main background with deep space gradient - EXPANDED */}
        <rect x="-50" y="-50" width="500" height="500" fill="url(#spaceGradient)" />
        
        {/* Cosmic dust and distant nebulae */}
        <rect width="400" height="400" fill="rgba(20,10,40,0.05)" filter="url(#cosmicDust)" />
        <rect width="400" height="400" fill="rgba(30,10,60,0.03)" filter="url(#purpleNebula)" />
        
        {/* Distant galaxy clusters */}
        <ellipse cx="50" cy="150" rx="40" ry="15" fill="rgba(150,130,255,0.06)" transform="rotate(-30 50 150)" />
        <ellipse cx="350" cy="50" rx="35" ry="12" fill="rgba(180,160,240,0.04)" transform="rotate(15 350 50)" />
        <ellipse cx="330" cy="320" rx="50" ry="20" fill="rgba(120,140,220,0.03)" transform="rotate(60 330 320)" />
        
        {/* Realistic starfield with multiple layers */}
        <g id="distantStars">
          {/* Hundreds of tiny distant stars */}
          <g fill="#ffffff" opacity="0.4">
            <circle cx="10" cy="15" r="0.3" />
            <circle cx="25" cy="30" r="0.2" />
            {/* Many more stars would be included here */}
            <circle cx="380" cy="390" r="0.3" />
          </g>
        </g>
        
        <g id="mediumStars">
          {/* Medium distance stars */}
          <circle cx="50" cy="50" r="0.7" fill="#ffffff" opacity="0.7" />
          <circle cx="100" cy="80" r="0.5" fill="#f0f8ff" opacity="0.7" />
          <circle cx="250" cy="120" r="0.6" fill="#ffffff" opacity="0.7" />
          <circle cx="300" cy="50" r="0.6" fill="#f0f8ff" opacity="0.7" />
          <circle cx="350" cy="200" r="0.5" fill="#ffffff" opacity="0.7" />
          <circle cx="150" cy="300" r="0.6" fill="#f0f8ff" opacity="0.7" />
          <circle cx="70" cy="350" r="0.5" fill="#ffffff" opacity="0.7" />
          <circle cx="320" cy="330" r="0.6" fill="#f0f8ff" opacity="0.7" />
          {/* Additional medium stars */}
          <circle cx="180" cy="40" r="0.6" fill="#ffffff" opacity="0.7" />
          <circle cx="240" cy="200" r="0.5" fill="#f0f8ff" opacity="0.7" />
          <circle cx="270" cy="280" r="0.6" fill="#ffffff" opacity="0.7" />
          <circle cx="120" cy="190" r="0.5" fill="#f0f8ff" opacity="0.7" />
          <circle cx="360" cy="120" r="0.4" fill="#ffffff" opacity="0.7" />
          <circle cx="30" cy="280" r="0.4" fill="#f0f8ff" opacity="0.7" />
          <circle cx="390" cy="330" r="0.5" fill="#ffffff" opacity="0.7" />
          <circle cx="210" cy="370" r="0.4" fill="#f0f8ff" opacity="0.7" />
        </g>
        
        <g id="brightStars">
          {/* Closer/brighter stars with glow */}
          <circle cx="85" cy="130" r="1.0" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="340" cy="85" r="1.2" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="170" cy="250" r="1.0" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="260" cy="340" r="1.1" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="40" cy="210" r="0.9" fill="#ffffff" filter="url(#starGlow)" />
          <circle cx="370" cy="270" r="1.0" fill="#ffffff" filter="url(#starGlow)" />
          
          {/* Few exceptionally bright stars */}
          <circle cx="320" cy="180" r="1.5" fill="#ffffff" filter="url(#brightStarGlow)" />
          <circle cx="75" cy="70" r="1.6" fill="#f8f8ff" filter="url(#brightStarGlow)" />
          <circle cx="190" cy="340" r="1.4" fill="#ffffff" filter="url(#brightStarGlow)" />
        </g>
        
        {/* Lens flare from bright star */}
        <circle cx="75" cy="70" r="30" fill="url(#lensFlare)" opacity="0.15" />
        
        {/* Realistic Moon with GSAP-like morph animations - MOVED UP AND RESPONSIVE */}
        <g id="moon" transform={moonTransform}>
          {/* Base lunar surface */}
          <circle cx="100" cy="250" r="40" fill="#e6e6e6">
            {/* Subtle pulsing animation to simulate lunar thermal expansion/contraction */}
            <animate attributeName="r" values="40;40.5;40" dur="30s" repeatCount="indefinite" />
          </circle>
          
          {/* Shadow side of the moon with dynamic movement */}
          <circle cx="100" cy="250" r="40" fill="url(#moonShadow)">
            {/* Shadow rotation to simulate moon's slow rotation */}
            <animateTransform attributeName="transform" type="rotate" from="0 100 250" to="5 100 250" dur="60s" repeatCount="indefinite" additive="sum" />
          </circle>
          
          {/* Subtle brightness variation in lunar surface with morphing effect */}
          <circle cx="100" cy="250" r="40" fill="url(#moonSurface)" opacity="0.3" />
          
          {/* Major lunar maria (dark areas) with morphing animations */}
          <g opacity="0.9">
            {/* Mare Imbrium (Sea of Rains) with shape morph */}
            <path d="M80 230 Q90 225 105 232 Q112 240 108 250 Q95 255 85 250 Q78 240 80 230" fill="#a0a0a0">
              <animate attributeName="d" values="
                M80 230 Q90 225 105 232 Q112 240 108 250 Q95 255 85 250 Q78 240 80 230;
                M82 228 Q92 223 107 230 Q114 238 110 252 Q97 257 87 252 Q80 242 82 228;
                M80 230 Q90 225 105 232 Q112 240 108 250 Q95 255 85 250 Q78 240 80 230" 
                dur="45s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#a0a0a0;#989898;#a0a0a0" dur="30s" repeatCount="indefinite" />
            </path>
            
            {/* Mare Serenitatis (Sea of Serenity) with shape morph */}
            <path d="M110 230 Q120 233 122 242 Q118 250 110 248 Q105 240 110 230" fill="#a8a8a8">
              <animate attributeName="d" values="
                M110 230 Q120 233 122 242 Q118 250 110 248 Q105 240 110 230;
                M112 228 Q122 231 124 240 Q120 252 112 250 Q107 242 112 228;
                M110 230 Q120 233 122 242 Q118 250 110 248 Q105 240 110 230" 
                dur="50s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#a8a8a8;#a2a2a2;#a8a8a8" dur="35s" repeatCount="indefinite" />
            </path>
            
            {/* Mare Tranquillitatis (Sea of Tranquility) with shape morph */}
            <path d="M115 248 Q125 245 130 255 Q125 265 115 260 Q112 255 115 248" fill="#9a9a9a">
              <animate attributeName="d" values="
                M115 248 Q125 245 130 255 Q125 265 115 260 Q112 255 115 248;
                M117 246 Q127 243 132 253 Q127 267 117 262 Q114 257 117 246;
                M115 248 Q125 245 130 255 Q125 265 115 260 Q112 255 115 248" 
                dur="55s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#9a9a9a;#959595;#9a9a9a" dur="40s" repeatCount="indefinite" />
            </path>
            
            {/* Oceanus Procellarum (Ocean of Storms) with shape morph */}
            <path d="M70 235 Q80 230 85 245 Q80 260 65 255 Q60 245 70 235" fill="#969696">
              <animate attributeName="d" values="
                M70 235 Q80 230 85 245 Q80 260 65 255 Q60 245 70 235;
                M68 233 Q78 228 83 247 Q78 262 63 257 Q58 247 68 233;
                M70 235 Q80 230 85 245 Q80 260 65 255 Q60 245 70 235" 
                dur="60s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#969696;#909090;#969696" dur="45s" repeatCount="indefinite" />
            </path>
            
            {/* Mare Nubium (Sea of Clouds) with shape morph */}
            <path d="M85 255 Q95 260 105 270 Q95 275 80 270 Q75 260 85 255" fill="#a5a5a5">
              <animate attributeName="d" values="
                M85 255 Q95 260 105 270 Q95 275 80 270 Q75 260 85 255;
                M87 253 Q97 258 107 268 Q97 277 82 272 Q77 262 87 253;
                M85 255 Q95 260 105 270 Q95 275 80 270 Q75 260 85 255" 
                dur="65s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#a5a5a5;#9f9f9f;#a5a5a5" dur="50s" repeatCount="indefinite" />
            </path>
          </g>
          
          {/* Major craters with animation effects */}
          <g>
            {/* Tycho crater with ray system and pulse effect */}
            <circle cx="90" cy="265" r="3" fill="#d6d6d6" stroke="#c0c0c0" strokeWidth="0.5">
              <animate attributeName="r" values="3;3.2;3" dur="20s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#d6d6d6;#e0e0e0;#d6d6d6" dur="25s" repeatCount="indefinite" />
            </circle>
            
            {/* Rays with length animation */}
            <path d="M90 265 L75 275" stroke="#e0e0e0" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="d" values="M90 265 L75 275;M90 265 L73 277;M90 265 L75 275" dur="30s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.7;0.6" dur="20s" repeatCount="indefinite" />
            </path>
            <path d="M90 265 L85 280" stroke="#e0e0e0" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="d" values="M90 265 L85 280;M90 265 L84 282;M90 265 L85 280" dur="35s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.7;0.6" dur="22s" repeatCount="indefinite" />
            </path>
            <path d="M90 265 L105 280" stroke="#e0e0e0" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="d" values="M90 265 L105 280;M90 265 L107 282;M90 265 L105 280" dur="32s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.7;0.6" dur="24s" repeatCount="indefinite" />
            </path>
            <path d="M90 265 L100 275" stroke="#e0e0e0" strokeWidth="0.5" opacity="0.6">
              <animate attributeName="d" values="M90 265 L100 275;M90 265 L102 277;M90 265 L100 275" dur="28s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.7;0.6" dur="26s" repeatCount="indefinite" />
            </path>
            
            {/* Other major craters with subtle pulsing */}
            <circle cx="75" cy="235" r="2.5" fill="#d0d0d0" stroke="#b8b8b8" strokeWidth="0.5">
              <animate attributeName="r" values="2.5;2.6;2.5" dur="25s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#d0d0d0;#d5d5d5;#d0d0d0" dur="30s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="60" cy="245" r="1.8" fill="#d4d4d4" stroke="#c0c0c0" strokeWidth="0.4">
              <animate attributeName="r" values="1.8;1.9;1.8" dur="27s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="95" cy="230" r="2" fill="#b0b0b0" stroke="#a0a0a0" strokeWidth="0.4">
              <animate attributeName="r" values="2;2.1;2" dur="29s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="95" cy="245" r="2.2" fill="#c0c0c0" stroke="#b0b0b0" strokeWidth="0.4">
              <animate attributeName="r" values="2.2;2.3;2.2" dur="31s" repeatCount="indefinite" />
            </circle>
            
            {/* Aristarchus crater (brightest spot) with glow pulse */}
            <circle cx="65" cy="230" r="1.5" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="0.3">
              <animate attributeName="r" values="1.5;1.7;1.5" dur="20s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#f0f0f0;#ffffff;#f0f0f0" dur="15s" repeatCount="indefinite" />
              <animate attributeName="strokeWidth" values="0.3;0.4;0.3" dur="15s" repeatCount="indefinite" />
            </circle>
            
            {/* Small scattered craters with random subtle movements */}
            <g>
              <circle cx="110" cy="240" r="1.2" fill="#d6d6d6" stroke="#c6c6c6" strokeWidth="0.2">
                <animate attributeName="r" values="1.2;1.25;1.2" dur="35s" repeatCount="indefinite" />
              </circle>
              <circle cx="120" cy="255" r="1.3" fill="#d8d8d8" stroke="#c8c8c8" strokeWidth="0.2">
                <animate attributeName="r" values="1.3;1.35;1.3" dur="40s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="260" r="0.8" fill="#d0d0d0" stroke="#c0c0c0" strokeWidth="0.2">
                <animate attributeName="r" values="0.8;0.85;0.8" dur="38s" repeatCount="indefinite" />
              </circle>
              <circle cx="100" cy="225" r="1" fill="#d2d2d2" stroke="#c2c2c2" strokeWidth="0.2">
                <animate attributeName="r" values="1;1.05;1" dur="42s" repeatCount="indefinite" />
              </circle>
              <circle cx="115" cy="235" r="0.7" fill="#d4d4d4" stroke="#c4c4c4" strokeWidth="0.2">
                <animate attributeName="r" values="0.7;0.75;0.7" dur="36s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
          
          {/* Subtle lunar surface texture with morphing behavior */}
          <g opacity="0.15">
            <path d="M65 220 Q80 215 95 220 Q110 225 125 220 Q135 230 135 245 Q130 265 115 275 Q95 285 75 275 Q60 260 60 240 Q60 225 65 220" fill="none" stroke="#707070" strokeWidth="0.1">
              <animate attributeName="d" values="
                M65 220 Q80 215 95 220 Q110 225 125 220 Q135 230 135 245 Q130 265 115 275 Q95 285 75 275 Q60 260 60 240 Q60 225 65 220;
                M67 218 Q82 213 97 218 Q112 223 127 218 Q137 228 137 243 Q132 267 117 277 Q97 287 77 277 Q62 262 62 238 Q62 223 67 218;
                M65 220 Q80 215 95 220 Q110 225 125 220 Q135 230 135 245 Q130 265 115 275 Q95 285 75 275 Q60 260 60 240 Q60 225 65 220" 
                dur="80s" repeatCount="indefinite" />
            </path>
            
            <path d="M70 225 Q85 220 100 225 Q115 230 125 225 Q130 235 130 245 Q125 260 110 270 Q95 275 80 270 Q65 260 65 240 Q65 230 70 225" fill="none" stroke="#808080" strokeWidth="0.1">
              <animate attributeName="d" values="
                M70 225 Q85 220 100 225 Q115 230 125 225 Q130 235 130 245 Q125 260 110 270 Q95 275 80 270 Q65 260 65 240 Q65 230 70 225;
                M72 223 Q87 218 102 223 Q117 228 127 223 Q132 233 132 243 Q127 262 112 272 Q97 277 82 272 Q67 258 67 238 Q67 228 72 223;
                M70 225 Q85 220 100 225 Q115 230 125 225 Q130 235 130 245 Q125 260 110 270 Q95 275 80 270 Q65 260 65 240 Q65 230 70 225" 
                dur="90s" repeatCount="indefinite" />
            </path>
          </g>
          
          {/* Dynamic lighting effect that slowly moves across the surface */}
          <circle cx="100" cy="250" r="40" fill="url(#radialLight)" opacity="0.07">
            <animate attributeName="opacity" values="0.07;0.09;0.07" dur="50s" repeatCount="indefinite" />
          </circle>
          
          {/* Very slight atmospheric 'glow' effect */}
          <circle cx="100" cy="250" r="40.5" fill="none" stroke="rgba(220,220,220,0.12)" strokeWidth="1">
            <animate attributeName="strokeOpacity" values="0.12;0.15;0.12" dur="30s" repeatCount="indefinite" />
            <animate attributeName="r" values="40.5;41;40.5" dur="40s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Animated orange planet with GSAP-like morphing effects - MOVED CLOSER AND RESPONSIVE */}
        <g id="orangePlanet" transform={orangePlanetTransform}>
          {/* Planet base with pulsing animation */}
          <circle cx="300" cy="120" r="20" fill="url(#orangePlanetGradient)">
            <animate attributeName="r" values="20;20.5;20" dur="15s" repeatCount="indefinite" />
          </circle>
          
          {/* Planet shadow side with morphing effect */}
          <circle cx="300" cy="120" r="20" fill="url(#orangePlanetShadow)">
            <animateTransform attributeName="transform" type="rotate" from="0 300 120" to="10 300 120" dur="30s" repeatCount="indefinite" additive="sum" />
          </circle>
          
          <circle cx="300" cy="120" r="20" fill="url(#dynamicOrangePlanetGradient)" opacity="0.6" />
          
          {/* Surface details - craters, canyons, terrain variation with morphing */}
          <g opacity="0.7">
            {/* Major surface features with morphing paths */}
            <path d="M290 105 Q300 110 315 108 Q310 125 295 128 Q280 125 290 105" fill="rgba(255,150,50,0.4)">
              <animate attributeName="d" values="
                M290 105 Q300 110 315 108 Q310 125 295 128 Q280 125 290 105;
                M288 103 Q298 108 317 106 Q312 127 293 130 Q278 127 288 103;
                M290 105 Q300 110 315 108 Q310 125 295 128 Q280 125 290 105" 
                dur="45s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(255,150,50,0.4);rgba(255,160,60,0.45);rgba(255,150,50,0.4)" dur="30s" repeatCount="indefinite" />
            </path>
            
            <path d="M280 120 Q295 122 310 115 Q315 130 300 138 Q285 135 280 120" fill="rgba(200,80,0,0.5)">
              <animate attributeName="d" values="
                M280 120 Q295 122 310 115 Q315 130 300 138 Q285 135 280 120;
                M278 118 Q293 120 312 113 Q317 132 302 140 Q283 137 278 118;
                M280 120 Q295 122 310 115 Q315 130 300 138 Q285 135 280 120" 
                dur="50s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(200,80,0,0.5);rgba(210,90,10,0.55);rgba(200,80,0,0.5)" dur="35s" repeatCount="indefinite" />
            </path>
            
            {/* Craters with pulsing and color change */}
            <circle cx="308" cy="112" r="3" fill="rgba(160,60,0,0.4)">
              <animate attributeName="r" values="3;3.2;3" dur="40s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(160,60,0,0.4);rgba(170,65,5,0.45);rgba(160,60,0,0.4)" dur="25s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="288" cy="122" r="2" fill="rgba(140,40,0,0.4)">
              <animate attributeName="r" values="2;2.15;2" dur="35s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(140,40,0,0.4);rgba(150,45,5,0.45);rgba(140,40,0,0.4)" dur="30s" repeatCount="indefinite" />
            </circle>
            
            <circle cx="295" cy="108" r="1.5" fill="rgba(180,70,0,0.4)">
              <animate attributeName="r" values="1.5;1.6;1.5" dur="30s" repeatCount="indefinite" />
              <animate attributeName="fill" values="rgba(180,70,0,0.4);rgba(190,75,5,0.45);rgba(180,70,0,0.4)" dur="35s" repeatCount="indefinite" />
            </circle>
            
            {/* Darker regions with morphing */}
            <path d="M297 128 Q305 125 310 130 Q305 138 295 135 Z" fill="rgba(120,30,0,0.3)">
              <animate attributeName="d" values="
                M297 128 Q305 125 310 130 Q305 138 295 135 Z;
                M296 127 Q304 124 311 131 Q306 139 294 136 Z;
                M297 128 Q305 125 310 130 Q305 138 295 135 Z" 
                dur="40s" repeatCount="indefinite" />
            </path>
          </g>
          
          {/* Subtle dust storms with animation */}
          <path d="M290 117 Q300 115 308 120" stroke="rgba(255,200,150,0.2)" strokeWidth="1" fill="none">
            <animate attributeName="d" values="
              M290 117 Q300 115 308 120;
              M290 118 Q301 116 308 122;
              M290 117 Q300 115 308 120" 
              dur="10s" repeatCount="indefinite" />
            <animate attributeName="strokeOpacity" values="0.2;0.3;0.2" dur="12s" repeatCount="indefinite" />
          </path>
          
          {/* Atmosphere and glow with pulsing */}
          <circle cx="300" cy="120" r="21" fill="none" stroke="rgba(255,200,150,0.15)" strokeWidth="2">
            <animate attributeName="strokeOpacity" values="0.15;0.2;0.15" dur="15s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="120" r="22" fill="none" stroke="rgba(255,180,120,0.1)" strokeWidth="1.5">
            <animate attributeName="r" values="22;22.5;22" dur="20s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Enhanced spacecraft with GSAP-like morph animations - SMALLER AND CENTERED UNDER CONTACT FORM AND RESPONSIVE */}
        <g id="spacecraft" transform={spacecraftTransform}>
          {/* Engine glow effect with dynamic pulsing */}
          <g filter="url(#rocketEngineGlow)">
            <circle cx="200" cy="250" r="5" fill="#ff5500" opacity="0.3">
              <animate attributeName="r" values="5;5.5;5" dur="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.4;0.3" dur="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="252" r="4" fill="#ff7700" opacity="0.4">
              <animate attributeName="r" values="4;4.5;4" dur="0.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.5;0.4" dur="0.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="254" r="3.5" fill="#ff9900" opacity="0.5">
              <animate attributeName="r" values="3.5;4;3.5" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.6;0.5" dur="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="256" r="3" fill="#ffbb00" opacity="0.6">
              <animate attributeName="r" values="3;3.5;3" dur="0.25s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="258" r="2.5" fill="#ffdd00" opacity="0.7">
              <animate attributeName="r" values="2.5;3;2.5" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="260" r="2" fill="#ffee66" opacity="0.8">
              <animate attributeName="r" values="2;2.5;2" dur="0.15s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="261" r="1" fill="#ffffff" opacity="0.9">
              <animate attributeName="r" values="1;1.3;1" dur="0.1s" repeatCount="indefinite" />
            </circle>
          </g>
          
          {/* Enhanced rocket exhaust with advanced morphing flame dynamics */}
          <g>
            {/* Outer flame with turbulent morphing */}
            <path d="M196 245 L204 245 L205 270 L195 270 Z" fill="#ff3300" opacity="0.7">
              <animate attributeName="d" values="
                M196 245 L204 245 L206 268 L194 268 Z;
                M195 245 L205 245 L207 272 L193 272 Z;
                M197 245 L203 245 L204 265 L196 265 Z;
                M196 245 L204 245 L206 268 L194 268 Z" 
                dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.8;0.7" dur="0.5s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#ff3300;#ff4400;#ff3300" dur="0.7s" repeatCount="indefinite" />
            </path>
            
            {/* Middle flame layer with more erratic morphing */}
            <path d="M197 245 L203 245 L202 260 L198 260 Z" fill="#ff6600" opacity="0.85">
              <animate attributeName="d" values="
                M197 245 L203 245 L204 262 L196 262 Z;
                M197.5 245 L202.5 245 L203 258 L197 258 Z;
                M197 245 L203 245 L202.5 265 L197.5 265 Z;
                M197 245 L203 245 L204 262 L196 262 Z" 
                dur="0.25s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0.9;0.85" dur="0.4s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#ff6600;#ff7700;#ff6600" dur="0.6s" repeatCount="indefinite" />
            </path>
            
            {/* Inner hot flame with dynamic morphing */}
            <path d="M198 245 L202 245 L201 255 L199 255 Z" fill="#ff9900" opacity="0.9">
              <animate attributeName="d" values="
                M198 245 L202 245 L201.5 257 L198.5 257 Z;
                M198.5 245 L201.5 245 L201 253 L199 253 Z;
                M198 245 L202 245 L201.5 258 L198.5 258 Z;
                M198 245 L202 245 L201.5 257 L198.5 257 Z" 
                dur="0.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.95;0.9" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#ff9900;#ffaa00;#ff9900" dur="0.5s" repeatCount="indefinite" />
            </path>
            
            {/* Hottest core with rapid morphing */}
            <path d="M199 245 L201 245 L200.7 252 L199.3 252 Z" fill="#ffdd00" opacity="0.95">
              <animate attributeName="d" values="
                M199 245 L201 245 L200.7 252 L199.3 252 Z;
                M199.2 245 L200.8 245 L200.5 250 L199.5 250 Z;
                M199 245 L201 245 L200.7 252 L199.3 252 Z" 
                dur="0.15s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.95;1;0.95" dur="0.25s" repeatCount="indefinite" />
              <animate attributeName="fill" values="#ffdd00;#ffee00;#ffdd00" dur="0.35s" repeatCount="indefinite" />
            </path>
            
            {/* Brightest core with intense morphing */}
            <path d="M199.3 245 L200.7 245 L200.5 248 L199.5 248 Z" fill="#ffffff" opacity="1">
              <animate attributeName="d" values="
                M199.3 245 L200.7 245 L200.5 248 L199.5 248 Z;
                M199.4 245 L200.6 245 L200.4 247 L199.6 247 Z;
                M199.3 245 L200.7 245 L200.5 248 L199.5 248 Z" 
                dur="0.1s" repeatCount="indefinite" />
            </path>
            
            {/* Smoke/exhaust particles with dynamic flow */}
            <g>
              <circle cx="195" cy="265" r="1.5" fill="#bbbbbb" opacity="0.5">
                <animate attributeName="cy" values="265;280" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1" dur="1s" repeatCount="indefinite" />
                <animate attributeName="cx" values="195;193" dur="1s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.5;2;0.5" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="205" cy="268" r="1.2" fill="#bbbbbb" opacity="0.5">
                <animate attributeName="cy" values="268;283" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="cx" values="205;207" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.2;1.8;0.4" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="192" cy="262" r="1" fill="#bbbbbb" opacity="0.5">
                <animate attributeName="cy" values="262;277" dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1" dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="cx" values="192;190" dur="0.9s" repeatCount="indefinite" />
                <animate attributeName="r" values="1;1.5;0.3" dur="0.9s" repeatCount="indefinite" />
              </circle>
              <circle cx="208" cy="270" r="1.3" fill="#bbbbbb" opacity="0.5">
                <animate attributeName="cy" values="270;285" dur="1.1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.1" dur="1.1s" repeatCount="indefinite" />
                <animate attributeName="cx" values="208;210" dur="1.1s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.3;1.9;0.4" dur="1.1s" repeatCount="indefinite" />
              </circle>
            </g>
          </g>
          
          {/* Main spacecraft body with morphing effects */}
          <path d="M195 220 L205 220 L205 245 L195 245 Z" fill="url(#metalGradient)" stroke="#b3b3b3" strokeWidth="0.5">
            {/* Very subtle expansion and contraction to simulate thermal effects */}
            <animate attributeName="d" values="
              M195 220 L205 220 L205 245 L195 245 Z;
              M195.2 220 L204.8 220 L204.8 245 L195.2 245 Z;
              M195 220 L205 220 L205 245 L195 245 Z" 
              dur="5s" repeatCount="indefinite" />
          </path>
          
          {/* Body panel details with subtle morphing */}
          <path d="M196 222 L204 222 L204 243 L196 243 Z" fill="none" stroke="#a0a0a0" strokeWidth="0.3">
            <animate attributeName="stroke" values="#a0a0a0;#b0b0b0;#a0a0a0" dur="6s" repeatCount="indefinite" />
          </path>
          <path d="M197 228 L203 228" stroke="#909090" strokeWidth="0.3" fill="none">
            <animate attributeName="d" values="
              M197 228 L203 228;
              M197 228.2 L203 228.2;
              M197 228 L203 228" 
              dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M197 234 L203 234" stroke="#909090" strokeWidth="0.3" fill="none">
            <animate attributeName="d" values="
              M197 234 L203 234;
              M197 234.2 L203 234.2;
              M197 234 L203 234" 
              dur="4.5s" repeatCount="indefinite" />
          </path>
          <path d="M197 240 L203 240" stroke="#909090" strokeWidth="0.3" fill="none">
            <animate attributeName="d" values="
              M197 240 L203 240;
              M197 240.2 L203 240.2;
              M197 240 L203 240" 
              dur="5s" repeatCount="indefinite" />
          </path>
          
          {/* Advanced nosecone design with morphing effects */}
          <path d="M200 180 L220 220 L200 210 L180 220 Z" fill="#cc0000" stroke="#aa0000" strokeWidth="0.5">
            <animate attributeName="d" values="
              M200 180 L220 220 L200 210 L180 220 Z;
              M200 179 L221 221 L200 209 L179 221 Z;
              M200 180 L220 220 L200 210 L180 220 Z" 
              dur="10s" repeatCount="indefinite" />
            <animate attributeName="fill" values="#cc0000;#dd0000;#cc0000" dur="8s" repeatCount="indefinite" />
          </path>
          <path d="M200 185 L212 210 L200 203 L188 210 Z" fill="#ff3333" opacity="0.4">
            <animate attributeName="d" values="
              M200 185 L212 210 L200 203 L188 210 Z;
              M200 184 L213 211 L200 202 L187 211 Z;
              M200 185 L212 210 L200 203 L188 210 Z" 
              dur="9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.5;0.4" dur="6s" repeatCount="indefinite" />
          </path>
          
          {/* Heat shield detail with subtle morphing */}
          <path d="M200 208 L210 218 L200 214 L190 218 Z" fill="#999999" opacity="0.5">
            <animate attributeName="d" values="
              M200 208 L210 218 L200 214 L190 218 Z;
              M200 207 L211 219 L200 213 L189 219 Z;
              M200 208 L210 218 L200 214 L190 218 Z" 
              dur="11s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.6;0.5" dur="7s" repeatCount="indefinite" />
          </path>
          
          {/* Enhanced fins with subtle movement */}
          <path d="M193 230 L185 245 L193 245 Z" fill="#b3b3b3" stroke="#999999" strokeWidth="0.5">
            <animate attributeName="d" values="
              M193 230 L185 245 L193 245 Z;
              M193 230 L184 245 L193 245 Z;
              M193 230 L185 245 L193 245 Z" 
              dur="8s" repeatCount="indefinite" />
          </path>
          
          <path d="M207 230 L215 245 L207 245 Z" fill="#b3b3b3" stroke="#999999" strokeWidth="0.5">
            <animate attributeName="d" values="
              M207 230 L215 245 L207 245 Z;
              M207 230 L216 245 L207 245 Z;
              M207 230 L215 245 L207 245 Z" 
              dur="8s" repeatCount="indefinite" />
          </path>
          
          {/* Small maneuvering thrusters with periodic firing effect */}
          <g id="leftThruster">
            <circle cx="192" cy="235" r="1" fill="#666666" stroke="#444444" strokeWidth="0.2" />
            {/* Thruster firing effect */}
            <path d="M191 235 L190 236 L192 236 L193 235" fill="#ffaa00" opacity="0">
              <animate attributeName="opacity" values="0;0.8;0" dur="3s" begin="2s" repeatCount="indefinite" />
            </path>
          </g>
          
          <g id="rightThruster">
            <circle cx="208" cy="235" r="1" fill="#666666" stroke="#444444" strokeWidth="0.2" />
            {/* Thruster firing effect */}
            <path d="M207 235 L206 236 L208 236 L209 235" fill="#ffaa00" opacity="0">
              <animate attributeName="opacity" values="0;0.8;0" dur="3s" begin="5s" repeatCount="indefinite" />
            </path>
          </g>
          
          {/* Spacecraft window with interior light and reflection that pulses */}
          <circle cx="200" cy="215" r="4" fill="#002244" stroke="#b3b3b3" strokeWidth="0.5" />
          <circle cx="200" cy="215" r="3.5" fill="#004488" stroke="none">
            <animate attributeName="fill" values="#004488;#003366;#004488" dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="215" r="3" fill="#0066aa" stroke="none">
            <animate attributeName="fill" values="#0066aa;#005599;#0066aa" dur="6s" repeatCount="indefinite" />
          </circle>
          <path d="M198 213 A3 3 0 0 0 201 217" fill="none" stroke="#80ccff" strokeWidth="0.5" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.9;0.7" dur="4s" repeatCount="indefinite" />
          </path>
          <circle cx="198" cy="213" r="1" fill="#ffffff" opacity="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="1;0.8;1" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Dynamic elements */}
        
        {/* Shooting stars / meteors */}
        <g>
          <path d="M360 50 L340 70" stroke="#ffffff" strokeWidth="1" opacity="0.7">
            <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" />
          </path>
          
          <path d="M40 100 L60 120" stroke="#ffffff" strokeWidth="0.8" opacity="0">
            <animate attributeName="opacity" values="0;0.6;0" dur="5s" begin="2s" repeatCount="indefinite" />
          </path>
        </g>
        
        {/* Distant passing spacecraft */}
        <g>
          <circle cx="380" cy="200" r="0.8" fill="#ff8800" opacity="0.6">
            <animate attributeName="cx" values="420;350" dur="30s" repeatCount="indefinite" />
          </circle>
          <circle cx="380" cy="200" r="0.3" fill="#ffffff" opacity="0.8">
            <animate attributeName="cx" values="420;350" dur="30s" repeatCount="indefinite" />
          </circle>
        </g>
        
        {/* Space dust particles */}
        <g opacity="0.3">
          <circle cx="150" cy="150" r="0.2" fill="#ffffff">
            <animate attributeName="cy" values="150;155;150" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="250" cy="220" r="0.15" fill="#ffffff">
            <animate attributeName="cy" values="220;225;220" dur="12s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="320" r="0.2" fill="#ffffff">
            <animate attributeName="cy" values="320;325;320" dur="15s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    </div>
  );
};

export default SpaceBackgroundAnimation;