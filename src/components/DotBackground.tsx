import React, { useEffect, useRef } from 'react';

export default function DotBackground({ color1, color2, color3, color4, power = 1.0, config }: { color1: string, color2: string, color3?: string, color4?: string, power?: number, config: { speed: number, size: number, density: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef(power);
  const configRef = useRef(config);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  const initDotsRef = useRef<() => void>(() => {});

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    initDotsRef.current();
  }, [config.density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;
    
    // Set display size (css pixels)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    // Normalize coordinate system to use css pixels
    ctx.scale(dpr, dpr);

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
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select')) {
        return;
      }
      
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.5 * powerRef.current,
        speed: 20 * Math.sqrt(powerRef.current),
        force: 10 * powerRef.current
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const dots: { x: number, y: number, baseX: number, baseY: number, vx: number, vy: number, color: string }[] = [];
    
    const initDots = () => {
      dots.length = 0;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      
      const spacing = configRef.current.density;
      
      for (let x = 0; x < width + spacing; x += spacing) {
        for (let y = 0; y < height + spacing; y += spacing) {
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

    initDotsRef.current = initDots;
    initDots();
    window.addEventListener('resize', initDots);

    let animationFrameId: number;

    const animate = () => {
      const { speed: speedPercentage, size, density: gridSpacing } = configRef.current;
      const speed = speedPercentage / 1000;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw faint grid behind everything
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 0.4;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update shockwaves
      for (let j = shockwaves.length - 1; j >= 0; j--) {
        const sw = shockwaves[j];
        sw.radius += sw.speed;
        if (sw.radius >= sw.maxRadius) {
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
          const maxDistance = 120 * Math.sqrt(powerRef.current);
          
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
            
            const ringThickness = 30;
            if (Math.abs(sdist - sw.radius) < ringThickness) {
              const forceMult = (ringThickness - Math.abs(sdist - sw.radius)) / ringThickness;
              const angle = Math.atan2(sdy, sdx);
              dot.vx += Math.cos(angle) * sw.force * forceMult;
              dot.vy += Math.sin(angle) * sw.force * forceMult;
            }
          }
          
          // 3. Spring back to original position (with slight sway)
          const time = Date.now() * 0.0008;
          const swayX = Math.sin(time + dot.baseX * 0.01) * 6.0;
          const swayY = Math.cos(time + dot.baseY * 0.01) * 6.0;
          
          dot.vx += (dot.baseX + swayX - dot.x) * speed;
          dot.vy += (dot.baseY + swayY - dot.y) * speed;
          
          // 4. Friction (dampening)
          dot.vx *= 0.82;
          dot.vy *= 0.82;
          
          // 5. Apply velocity to position
          dot.x += dot.vx;
          dot.y += dot.vy;
        }
        
        // Cursor brightness effect
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const brightnessRadius = 150 * Math.sqrt(powerRef.current);
        let brightness = 1;
        if (distance < brightnessRadius && powerRef.current > 0) {
          brightness = 1 + (1 - distance / brightnessRadius) * 2;
        }

        // Shockwave brightness effect
        for (let j = 0; j < shockwaves.length; j++) {
          const sw = shockwaves[j];
          const sdx = dot.x - sw.x;
          const sdy = dot.y - sw.y;
          const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
          const ringThickness = 40;
          if (Math.abs(sdist - sw.radius) < ringThickness) {
            const brightMult = (ringThickness - Math.abs(sdist - sw.radius)) / ringThickness;
            const fadeOut = Math.max(0, 1 - (sw.radius / sw.maxRadius));
            brightness = Math.max(brightness, 1 + brightMult * 2.5 * fadeOut);
          }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        
        // Apply brightness to color
        if (brightness > 1) {
          ctx.fillStyle = dot.color.replace('0.4', (0.4 * brightness).toString());
          ctx.shadowBlur = 10 * (brightness - 1);
          ctx.shadowColor = dot.color;
        } else {
          ctx.fillStyle = dot.color;
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for next dot
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
