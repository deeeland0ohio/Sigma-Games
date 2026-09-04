import React, { useEffect, useRef } from 'react';

interface MatrixConfig {
  speed: number;
  size: number;
  density: number;
}

export default function MatrixBackground({ 
  color, 
  power = 1.0,
  config = { speed: 50, size: 50, density: 50 }
}: { 
  color: string, 
  power?: number,
  config?: MatrixConfig
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef(power);
  const configRef = useRef(config);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  const initDropsRef = useRef<() => void>(() => {});

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    initDropsRef.current();
  }, [config.density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;
    
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    interface Drop {
      x: number;
      y: number;
      vx: number;
      vy: number;
      char: string;
      speed: number;
      opacity: number;
    }
    
    let drops: Drop[] = [];
    
    const createDrop = (yStart = -20) => {
      const baseSpeed = (2 + Math.random() * 3);
      
      return {
        x: Math.random() * width,
        y: yStart,
        vx: 0,
        vy: baseSpeed,
        char: Math.random() > 0.5 ? '1' : '0',
        speed: baseSpeed,
        opacity: 0.3 + Math.random() * 0.7
      };
    };

    const initDrops = () => {
      const { density } = configRef.current;
      const densityFactor = density / 50;
      const maxDrops = Math.floor((width * height) / 4000 * densityFactor);
      drops = [];
      for (let i = 0; i < maxDrops; i++) {
        drops.push(createDrop(Math.random() * height));
      }
    };

    initDropsRef.current = initDrops;
    initDrops();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      
      initDrops();
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const animate = () => {
      const { speed, size } = configRef.current;
      const speedFactor = (speed / 50) * 0.6;
      const fontSize = 12 + (size / 100) * 16; // Range 12-28, default ~20

      // Fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        
        const currentTargetSpeed = drop.speed * speedFactor;
        const speedMult = powerRef.current === 0 ? 0.4 : powerRef.current;
        
        // Gravity / natural flow
        drop.vy += 0.05 * 0.6 * speedMult;
        if (drop.vy > currentTargetSpeed * 1.5 * speedMult) drop.vy = currentTargetSpeed * 1.5 * speedMult;
        
        // Mouse interaction (bounce off cursor like water)
        const dx = drop.x - mouse.x;
        const dy = drop.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120 * powerRef.current; 
        
        if (dist < maxDist && powerRef.current > 0) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          drop.vx += Math.cos(angle) * force * 1.5 * powerRef.current;
          drop.vy += Math.sin(angle) * force * 1.5 * powerRef.current;
        }
        
        drop.vx *= 0.96; 
        drop.x += drop.vx;
        drop.y += drop.vy;
        
        if (drop.y > height + 20 || drop.x < -20 || drop.x > width + 20) {
          Object.assign(drop, createDrop(-20));
        }
        
        // Draw
        ctx.globalAlpha = drop.opacity;
        ctx.fillStyle = color;
        ctx.fillText(drop.char, drop.x, drop.y);
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-10 pointer-events-none bg-zinc-950"
    />
  );
}
