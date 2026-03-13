import React, { useEffect, useRef } from 'react';

export default function BlackHoleBackground({ color1, color2, color3, color4, power = 1.0 }: { color1: string, color2: string, color3?: string, color4?: string, power?: number }) {
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

    interface Dash {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseY: number;
      baseSpeed: number;
      length: number;
      color: string;
      opacity: number;
    }

    interface FluidBlob {
      angle: number;
      speed: number;
      dist: number;
      size: number;
      color: string;
      offset: number;
    }

    const dashes: Dash[] = [];
    const maxDashes = Math.floor((width * height) / 3000);

    const createDash = (xStart?: number) => {
      const palette = [color1, color2];
      if (color3) palette.push(color3);
      if (color4) palette.push(color4);
      const color = palette[Math.floor(Math.random() * palette.length)];
      
      const baseSpeed = 1 + Math.random() * 3;
      return {
        x: xStart ?? Math.random() * width,
        y: Math.random() * height,
        vx: baseSpeed,
        vy: 0,
        baseY: 0, // Set after creation
        baseSpeed,
        length: 10 + Math.random() * 30,
        color: color,
        opacity: 0.1 + Math.random() * 0.5
      };
    };

    for (let i = 0; i < maxDashes; i++) {
      const dash = createDash();
      dash.baseY = dash.y;
      dashes.push(dash);
    }

    // Initialize fluid blobs for the accretion disk
    const blobs: FluidBlob[] = [];
    
    const getFluidColor = (c: string) => {
      if (c.includes('rgba')) {
        return c.replace(/0\.\d+\)/, '0.04)');
      } else if (c.startsWith('#')) {
        // Convert hex to rgba
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.04)`;
      }
      return c;
    };

    const fluidPalette = [getFluidColor(color1), getFluidColor(color2)];
    if (color3) fluidPalette.push(getFluidColor(color3));
    if (color4) fluidPalette.push(getFluidColor(color4));
    
    for (let i = 0; i < 45; i++) {
      blobs.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.015, // Base speed, multiplied by power in animate loop
        dist: 20 + Math.random() * 50,
        size: 40 + Math.random() * 50,
        color: fluidPalette[Math.floor(Math.random() * fluidPalette.length)],
        offset: Math.random() * 100
      });
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
      ctx.clearRect(0, 0, width, height);

      // Draw event horizon glow if mouse is active
      if (mouse.x > -1000 && powerRef.current > 0) {
        const time = Date.now() * 0.001;
        
        ctx.save();
        // Use screen blending for a bright, fluid light effect
        ctx.globalCompositeOperation = 'screen';

        // Intense inner gas glow
        const innerGlowRadius = 130; // Larger radius for a smoother fade
        const innerGlow = ctx.createRadialGradient(mouse.x, mouse.y, 35, mouse.x, mouse.y, innerGlowRadius);
        
        const getIntenseColor = (c: string) => {
          if (c.includes('rgba')) {
            return c.replace(/0\.\d+\)/, '0.6)');
          } else if (c.startsWith('#')) {
            const r = parseInt(c.slice(1, 3), 16);
            const g = parseInt(c.slice(3, 5), 16);
            const b = parseInt(c.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
          }
          return c;
        };

        const intenseC1 = getIntenseColor(color1);
        const intenseC2 = getIntenseColor(color2); // Balanced mid-glow
        
        innerGlow.addColorStop(0, intenseC1);
        innerGlow.addColorStop(0.35, intenseC2);
        innerGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, innerGlowRadius, 0, Math.PI * 2);
        ctx.fillStyle = innerGlow;
        ctx.fill();
        
        for (let i = 0; i < blobs.length; i++) {
          const blob = blobs[i];
          // Spin counter-clockwise to match dashes, scaled by real-time power
          blob.angle -= blob.speed * powerRef.current;
          
          // Wobble distance for fluid effect
          const currentDist = blob.dist + Math.sin(time * 2 + blob.offset) * 15;
          const bx = mouse.x + Math.cos(blob.angle) * currentDist;
          const by = mouse.y + Math.sin(blob.angle) * currentDist;
          
          // Make blobs brighter the closer they are to the center, fading out nicely
          const brightness = Math.max(0, 1 - (currentDist / 90));
          const dynamicOpacity = (0.04 + brightness * 0.8).toFixed(2);
          const dynamicColor = blob.color.replace('0.04)', `${dynamicOpacity})`);

          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blob.size);
          grad.addColorStop(0, dynamicColor);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.beginPath();
          ctx.arc(bx, by, blob.size, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
        ctx.restore();

        // Draw pure black center
        const centerRadius = 35;
        const centerGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, centerRadius + 15);
        centerGrad.addColorStop(0, 'rgba(0,0,0,1)');
        centerGrad.addColorStop(0.85, 'rgba(0,0,0,1)'); // Event horizon
        centerGrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, centerRadius + 15, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < dashes.length; i++) {
        const dash = dashes[i];

        // Black hole effect
        const dx = mouse.x - dash.x;
        const dy = mouse.y - dash.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 300; // Event horizon pull radius

        if (dist < maxDist && dist > 0 && powerRef.current > 0) {
          // Calculate gravitational pull (exponential for stronger pull near center)
          const force = Math.pow((maxDist - dist) / maxDist, 2);
          
          // Pull towards mouse (gravity)
          const angle = Math.atan2(dy, dx);
          
          // Add a swirling effect (perpendicular to gravity, slightly inward)
          const swirlAngle = angle + Math.PI / 2.2; 
          
          // Apply forces (scaled by real-time power)
          const pullStrength = force * 0.4 * powerRef.current;
          const swirlStrength = force * 1.5 * powerRef.current;

          dash.vx += Math.cos(angle) * pullStrength + Math.cos(swirlAngle) * swirlStrength;
          dash.vy += Math.sin(angle) * pullStrength + Math.sin(swirlAngle) * swirlStrength;
          
          ctx.globalAlpha = Math.min(dash.opacity + force * 2, 1);

          // If it gets too close to the center, reset it (fell into the black hole)
          if (dist < 30) {
            Object.assign(dash, createDash(-50));
            dash.baseY = dash.y;
          }
        } else {
          // Slowly return to base Y and normal speed
          const speedMult = powerRef.current === 0 ? 0.4 : powerRef.current;
          dash.vy += (0 - dash.vy) * 0.05;
          dash.vx += (dash.baseSpeed * speedMult - dash.vx) * 0.05;
          dash.y += (dash.baseY - dash.y) * 0.02;
          ctx.globalAlpha = dash.opacity;
        }

        // Stricter speed limit to prevent crazy fast lines
        const currentSpeed = Math.sqrt(dash.vx * dash.vx + dash.vy * dash.vy);
        const limitMult = powerRef.current === 0 ? 0.4 : powerRef.current;
        const maxSpeed = 6 * limitMult;
        if (currentSpeed > maxSpeed) {
          dash.vx = (dash.vx / currentSpeed) * maxSpeed;
          dash.vy = (dash.vy / currentSpeed) * maxSpeed;
        }

        dash.x += dash.vx;
        dash.y += dash.vy;

        // Wrap around screen
        if (dash.x > width + dash.length) {
          Object.assign(dash, createDash(-50));
          dash.baseY = dash.y;
        }

        // Draw dash oriented by velocity
        const drawAngle = Math.atan2(dash.vy, dash.vx);
        ctx.beginPath();
        ctx.moveTo(dash.x, dash.y);
        ctx.lineTo(dash.x + Math.cos(drawAngle) * dash.length, dash.y + Math.sin(drawAngle) * dash.length);
        ctx.strokeStyle = dash.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color1, color2, color3, color4]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-10 pointer-events-none bg-zinc-950"
    />
  );
}
