import React, { useEffect, useRef } from 'react';

export default function MatrixBackground({ color, power = 1.0 }: { color: string, power?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef(power);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

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

    const fontSize = 16;
    
    interface Drop {
      x: number;
      y: number;
      vx: number;
      vy: number;
      char: string;
      speed: number;
      opacity: number;
    }
    
    const drops: Drop[] = [];
    const maxDrops = Math.floor((width * height) / 4000); // Scale density based on screen size
    
    const createDrop = (yStart = -20) => {
      // Slow down by 40% (multiply by 0.6)
      const baseSpeed = (2 + Math.random() * 3) * 0.6;
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

    for (let i = 0; i < maxDrops; i++) {
      drops.push(createDrop(Math.random() * height));
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const animate = () => {
      // Fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        
        const speedMult = powerRef.current === 0 ? 0.4 : 1.0;
        
        // Gravity / natural flow
        drop.vy += 0.05 * 0.6 * speedMult;
        if (drop.vy > drop.speed * 1.5 * speedMult) drop.vy = drop.speed * 1.5 * speedMult;
        
        // Mouse interaction (bounce off cursor like water)
        const dx = drop.x - mouse.x;
        const dy = drop.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120 * powerRef.current; // cursor repulsion radius scales with power
        
        if (dist < maxDist && powerRef.current > 0) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          
          // Splash away (scaled by power)
          drop.vx += Math.cos(angle) * force * 1.5 * powerRef.current;
          drop.vy += Math.sin(angle) * force * 1.5 * powerRef.current;
        }
        
        // Air resistance / return to normal flow
        drop.vx *= 0.96; // slow down horizontal movement
        
        // Move
        drop.x += drop.vx;
        drop.y += drop.vy;
        
        // Wrap around or reset
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
