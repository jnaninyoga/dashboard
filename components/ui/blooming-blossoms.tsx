"use client";

import React from "react";

// Palettes built strictly from your globals.css brand colors
const PALETTES = [
  // 1. Brand Blush/Rose 
  { 
    light: "#FADCDB", // --color-secondary
    mid: "#FCD0C7",   // --color-sidebar-accent
    dark: "#F0A8A8"   // Darkened blush for depth
  },
  // 2. Brand Teal
  { 
    light: "#8CC9D2", // --color-accent
    mid: "#54A5B3",   // --color-primary
    dark: "#3A7A85"   // Darkened teal for depth
  },
];

const ClassicLotus = ({ 
  style, 
  palette, 
  size = 20,
  fallDuration = 20,
  swayDuration = 8,
  delay = 0,
  blur = 0,
  opacity = 1,
  rotationOffset = 0
}: { 
  style: React.CSSProperties, 
  palette: { light: string, mid: string, dark: string },
  size?: number,
  fallDuration?: number,
  swayDuration?: number,
  delay?: number,
  blur?: number,
  opacity?: number,
  rotationOffset?: number
}) => {
  return (
    // Wrapper 1: The downward fall (Gravity)
    <div 
      className="pointer-events-none absolute"
      style={{
        ...style,
        width: size,
        height: size,
        opacity: opacity,
        filter: `blur(${blur}px)`,
        animation: `fall ${fallDuration}s linear ${delay}s infinite`,
      }}
    >
      {/* Wrapper 2: The organic horizontal sway and tilt (Wind) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          animation: `sway ${swayDuration}s ease-in-out ${delay}s infinite`,
        }}
      >
        {/* Wrapper 3: Initial Bloom & Base Rotation */}
        <div style={{ 
            width: "100%", 
            height: "100%", 
            transform: `rotate(${rotationOffset}deg)`,
            transformOrigin: "bottom center",
            animation: `lotus-bloom 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s backwards`
        }}>
          {/* 7-Petal Classic Side-Profile Lotus SVG */}
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
            
            {/* Back/Outer Petals (Darkest for depth) */}
            <path d="M50 90 C 20 85 5 50 15 35 C 25 55 40 80 50 90 Z" fill={palette.dark} />
            <path d="M50 90 C 80 85 95 50 85 35 C 75 55 60 80 50 90 Z" fill={palette.dark} />

            {/* Mid/Inner Petals (Medium tone) */}
            <path d="M50 90 C 35 80 15 35 30 15 C 35 40 45 75 50 90 Z" fill={palette.mid} />
            <path d="M50 90 C 65 80 85 35 70 15 C 65 40 55 75 50 90 Z" fill={palette.mid} />

            {/* Front Bottom Horizontal Petals (Darkest for base contrast) */}
            <path d="M50 90 C 25 95 0 85 5 70 C 15 80 30 88 50 90 Z" fill={palette.dark} />
            <path d="M50 90 C 75 95 100 85 95 70 C 85 80 70 88 50 90 Z" fill={palette.dark} />

            {/* Center Top Petal (Lightest highlight) */}
            <path d="M50 90 C 40 65 35 15 50 5 C 65 15 60 65 50 90 Z" fill={palette.light} />
            
          </svg>
        </div>
      </div>
    </div>
  );
};

export const BloomingBlossoms = () => {
  // Generate a dense field of 60 lotuses
  const lotuses = Array.from({ length: 60 }).map((_, i) => {
    // Distribute palettes: 75% Blush/Pink, 25% Teal accent
    const isTeal = i % 4 === 0;
    const palette = isTeal ? PALETTES[1] : PALETTES[0];
    
    // Parallax Layering Logic (0 = Background, 1 = Midground, 2 = Foreground)
    const layer = i % 3; 
    
    let size, fallDuration, blur, opacity;

    if (layer === 0) {
      // Background
      size = 14 + (i % 8);
      fallDuration = 25 + (i % 15);
      blur = 2.5;
      opacity = 0.4;
    } else if (layer === 1) {
      // Midground
      size = 24 + (i % 12);
      fallDuration = 18 + (i % 10);
      blur = 1;
      opacity = 0.7;
    } else {
      // Foreground
      size = 38 + (i % 18);
      fallDuration = 12 + (i % 8);
      blur = 0;
      opacity = 0.95;
    }

    return {
      id: i,
      palette,
      size,
      blur,
      opacity,
      // Distribute evenly across the screen horizontally (-5% to 105% to cover edges)
      left: `${(i * 17) % 110 - 5}%`, 
      // Start slightly above the viewport
      top: "-15%", 
      fallDuration,
      swayDuration: 6 + (i % 5),
      // Massive negative delays so the animation is fully populated immediately on load
      delay: -(i * 31) % 60, 
      // Natural tilt (-20deg to +20deg)
      rotationOffset: -20 + ((i * 7) % 40), 
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {lotuses.map((l) => (
        <ClassicLotus
          key={l.id}
          palette={l.palette}
          size={l.size}
          fallDuration={l.fallDuration}
          swayDuration={l.swayDuration}
          delay={l.delay}
          blur={l.blur}
          opacity={l.opacity}
          rotationOffset={l.rotationOffset}
          style={{
            top: l.top,
            left: l.left,
          }}
        />
      ))}
    </div>
  );
};