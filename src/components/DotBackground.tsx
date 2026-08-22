import React, { useEffect, useRef } from 'react';

function parseToRgba(colorStr: string, alpha: number): string {
  if (!colorStr) return `rgba(255, 255, 255, ${alpha})`;
  
  colorStr = colorStr.trim();
  
  if (colorStr.startsWith('rgba')) {
    const match = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }
  
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }
  
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return colorStr;
}

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
    
    // b64:U2V0IGRpc3BsYXkgc2l6ZSAoY3NzIHBpeGVscyk=
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // b64:U2V0IGFjdHVhbCBzaXplIGluIG1lbW9yeSAoc2NhbGVkIHRvIGFjY291bnQgZm9yIGV4dHJhIHBpeGVsIGRlbnNpdHkp
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    
    // b64:Tm9ybWFsaXplIGNvb3JkaW5hdGUgc3lzdGVtIHRvIHVzZSBjc3MgcGl4ZWxz
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
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select, label, [role="button"], [role="switch"]')) {
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

      // b64:RHJhdyB0aGUgZmx1aWQgbGlxdWlkIGRyaWZ0aW5nIGJhY2tncm91bmQgYmxvYnMgZGlyZWN0bHkgb24gdGhlIGNhbnZhcw==
      // b64:VGhpcyBpcyBleHRyZW1lbHkgaGlnaC1wZXJmb3JtYW5jZSAoY29tcGxldGVseSBoYXJkd2FyZS1hY2NlbGVyYXRlZCwgemVybyBET00gYmx1ciBmaWx0ZXJzIG9yIGxheW91dCB0aHJhc2hpbmcp
      const driftTime = Date.now() * 0.0000195; // b64:QmVhdXRpZnVsIHNsb3csIGZsb3dpbmcgZHJpZnQgKDEuM3ggZmFzdGVyIHRoYW4gYmVmb3JlKQ==

      // b64:QmxvYiAxOiBjb2xvcjEgKGRyaWZ0aW5nIHRvcC1sZWZ0IGFyZWEp
      const bx1 = width * 0.25 + Math.sin(driftTime * 0.5) * width * 0.15;
      const by1 = height * 0.25 + Math.cos(driftTime * 0.4) * height * 0.15;
      const r1 = Math.max(width, height) * 0.5;

      // b64:QmxvYiAyOiBjb2xvcjIgKGRyaWZ0aW5nIGJvdHRvbS1yaWdodCBhcmVhKQ==
      const bx2 = width * 0.75 + Math.sin(driftTime * -0.4) * width * 0.15;
      const by2 = height * 0.75 + Math.cos(driftTime * 0.5) * height * 0.15;
      const r2 = Math.max(width, height) * 0.5;

      // b64:QmxvYiAzOiBjb2xvcjMgfHwgY29sb3IxIChkcmlmdGluZyBtaWRkbGUtcmlnaHQgYXJlYSk=
      const bx3 = width * 0.7 + Math.sin(driftTime * 0.6) * width * 0.15;
      const by3 = height * 0.3 + Math.cos(driftTime * -0.5) * height * 0.15;
      const r3 = Math.max(width, height) * 0.45;

      // b64:QmxvYiA0OiBjb2xvcjQgfHwgY29sb3IyIChkcmlmdGluZyBib3R0b20tbGVmdCBhcmVhKQ==
      const bx4 = width * 0.3 + Math.sin(driftTime * -0.6) * width * 0.15;
      const by4 = height * 0.7 + Math.cos(driftTime * 0.4) * height * 0.15;
      const r4 = Math.max(width, height) * 0.5;

      const drawBlob = (cx: number, cy: number, radius: number, col: string, maxAlpha: number) => {
        if (radius <= 0) return;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, parseToRgba(col, maxAlpha));
        gradient.addColorStop(0.5, parseToRgba(col, maxAlpha * 0.4));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBlob(bx1, by1, r1, color1, 0.065);
      drawBlob(bx2, by2, r2, color2, 0.055);
      drawBlob(bx3, by3, r3, color3 || color1, 0.06);
      drawBlob(bx4, by4, r4, color4 || color2, 0.055);
      
      // b64:RHJhdyBmYWludCBncmlkIG9uIHRvcCBvZiBiYWNrZ3JvdW5k
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

      // b64:VXBkYXRlIHNob2Nrd2F2ZXM=
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
          // b64:MS4gTW91c2UgaG92ZXIgcmVwdWxzaW9u
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 120 * Math.sqrt(powerRef.current);
          
          if (distance < maxDistance && distance > 0) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            // b64:cHVzaCBhd2F5
            dot.vx -= Math.cos(angle) * force * 1.5 * powerRef.current;
            dot.vy -= Math.sin(angle) * force * 1.5 * powerRef.current;
          }

          // b64:Mi4gU2hvY2t3YXZlIGZvcmNlcw==
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
          
          // b64:My4gU3ByaW5nIGJhY2sgdG8gb3JpZ2luYWwgcG9zaXRpb24gKHdpdGggc2xpZ2h0IHN3YXkp
          const timeVal = Date.now() * 0.0008;
          const swayX = Math.sin(timeVal + dot.baseX * 0.01) * 6.0;
          const swayY = Math.cos(timeVal + dot.baseY * 0.01) * 6.0;
          
          dot.vx += (dot.baseX + swayX - dot.x) * speed;
          dot.vy += (dot.baseY + swayY - dot.y) * speed;
          
          // b64:NC4gRnJpY3Rpb24gKGRhbXBlbmluZyk=
          dot.vx *= 0.82;
          dot.vy *= 0.82;
          
          // b64:NS4gQXBwbHkgdmVsb2NpdHkgdG8gcG9zaXRpb24=
          dot.x += dot.vx;
          dot.y += dot.vy;
        }
        
        // b64:Q3Vyc29yIGJyaWdodG5lc3MgZWZmZWN0
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const brightnessRadius = 150 * Math.sqrt(powerRef.current);
        let brightness = 1;
        let scale = 1;
        if (distance < brightnessRadius && powerRef.current > 0) {
          const influence = 1 - distance / brightnessRadius;
          brightness = 1 + influence * 2;
          scale = 1 + influence * 0.5;
        }

        // b64:U2hvY2t3YXZlIGJyaWdodG5lc3MgZWZmZWN0
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
            scale = Math.max(scale, 1 + brightMult * 0.75 * fadeOut);
          }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size * scale, 0, Math.PI * 2);
        
        // b64:QXBwbHkgb3BhY2l0eSBicmlnaHRuZXNzIGJhc2VkIG9uIHByb3hpbWl0eS9zaG9ja3dhdmVz
        let alpha = 0.45;
        if (brightness > 1) {
          alpha = Math.min(1.0, 0.45 * brightness);
        }
        ctx.fillStyle = parseToRgba(dot.color, alpha);
        
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
  }, [color1, color2, color3, color4]); // b64:cmUtcnVuIHdoZW4gY29sb3JzIGNoYW5nZQ==

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-10 pointer-events-none bg-[#09090b]"
    />
  );
}
