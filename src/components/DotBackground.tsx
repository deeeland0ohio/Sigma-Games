import React, { useEffect, useRef } from 'react';

export default function DotBackground({ color1, color2, color3, color4, power = 1.0 }: { color1: string, color2: string, color3?: string, color4?: string, power?: number }) {
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
    const shockwaves: { x: number, y: number, radius: number, maxRadius: number, speed: number, force: number }[] = [];
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.5 * powerRef.current, // scale max radius with power
        speed: 20 * Math.sqrt(powerRef.current), // scale speed slightly with power
        force: 10 * powerRef.current  // scale force with power
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const dots: { x: number, y: number, baseX: number, baseY: number, vx: number, vy: number, color: string }[] = [];
    const spacing = 35; // Distance between dots
    
    const initDots = () => {
      dots.length = 0;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const palette = [color1, color2];
          if (color3) palette.push(color3);
          if (color4) palette.push(color4);
          let color = palette[Math.floor(Math.random() * palette.length)];
          
          dots.push({
            x, y,
            baseX: x, baseY: y,
            vx: 0, vy: 0,
            color
          });
        }
      }
    };

    initDots();
    window.addEventListener('resize', initDots);

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update shockwaves
      for (let j = shockwaves.length - 1; j >= 0; j--) {
        const sw = shockwaves[j];
        sw.radius += sw.speed;
        if (sw.radius > sw.maxRadius) {
          shockwaves.splice(j, 1);
        }
      }
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        
        if (powerRef.current === 0) {
          dot.x = dot.baseX;
          dot.y = dot.baseY;
          dot.vx = 0;
          dot.vy = 0;
        } else {
          // 1. Mouse hover repulsion
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 120 * Math.sqrt(powerRef.current); // How far the mouse affects dots
          
          if (distance < maxDistance && distance > 0) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            // push away
            dot.vx -= Math.cos(angle) * force * 1.5 * powerRef.current;
            dot.vy -= Math.sin(angle) * force * 1.5 * powerRef.current;
          }

          // 2. Shockwave forces
          for (let j = 0; j < shockwaves.length; j++) {
            const sw = shockwaves[j];
            const sdx = dot.x - sw.x;
            const sdy = dot.y - sw.y;
            const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
            
            const ringThickness = 30; // smaller ring thickness
            if (Math.abs(sdist - sw.radius) < ringThickness) {
              const forceMult = (ringThickness - Math.abs(sdist - sw.radius)) / ringThickness;
              const angle = Math.atan2(sdy, sdx);
              // push outward from the shockwave center
              dot.vx += Math.cos(angle) * sw.force * forceMult;
              dot.vy += Math.sin(angle) * sw.force * forceMult;
            }
          }
          
          // 3. Spring back to original position
          dot.vx += (dot.baseX - dot.x) * 0.04;
          dot.vy += (dot.baseY - dot.y) * 0.04;
          
          // 4. Friction (dampening)
          dot.vx *= 0.82;
          dot.vy *= 0.82;
          
          // 5. Apply velocity to position
          dot.x += dot.vx;
          dot.y += dot.vy;
        }
        
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', initDots);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color1, color2, color3, color4]); // re-run when colors change

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-10 pointer-events-none bg-zinc-950"
    />
  );
}
