import React, { useEffect, useRef } from 'react';

export default function LightspeedBackground({ color1, color2, color3, color4, power = 1.0 }: { color1: string, color2: string, color3?: string, color4?: string, power?: number }) {
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

    let isMouseDown = false;
    let warpFactor = 0;

    const stars: { x: number, y: number, z: number, color: string, warpStartZ: number }[] = [];
    const numStars = 1440; // Abundant stars (800 * 1.8)

    const pickColor = () => {
      const palette = [color1, color2];
      if (color3) palette.push(color3);
      if (color4) palette.push(color4);
      return palette[Math.floor(Math.random() * palette.length)];
    };

    const resetStar = (star: { x: number, y: number, z: number, color: string, warpStartZ: number }) => {
      const angle = Math.random() * Math.PI * 2;
      // Keep stars away from the center ONLY when clicking/warping
      const minR = warpFactor > 0.1 ? Math.min(width, height) * 0.25 : 0; 
      const maxR = Math.max(width, height) * 1.5;
      const r = minR + Math.random() * (maxR - minR);
      star.x = Math.cos(angle) * r;
      star.y = Math.sin(angle) * r;
      star.z = width;
      star.warpStartZ = width;
      star.color = pickColor();
    };

    const initStars = () => {
      stars.length = 0;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      for (let i = 0; i < numStars; i++) {
        const star = { x: 0, y: 0, z: 0, color: pickColor(), warpStartZ: 0 };
        resetStar(star);
        star.z = Math.random() * width; // Randomize initial depth
        star.warpStartZ = star.z;
        stars.push(star);
      }
    };

    initStars();
    window.addEventListener('resize', initStars);

    const handlePointerDown = () => {
      isMouseDown = true;
      // Anchor the start of the tail to current position when clicking
      stars.forEach(star => {
        star.warpStartZ = star.z;
      });
    };

    const handlePointerUp = () => {
      isMouseDown = false;
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchend', handlePointerUp);

    let animationFrameId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // 5.0 seconds to reach max speed when clicking
      // 1.5 seconds to slow down when releasing
      if (isMouseDown) {
        warpFactor = Math.min(1, warpFactor + dt / 5.0);
      } else {
        warpFactor = Math.max(0, warpFactor - dt / 1.5);
      }

      // Dark background with a fast trail effect to prevent stamped circles
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = `rgba(0, 0, 0, 0.4)`; 
      ctx.fillRect(0, 0, width, height);

      // Calculate speed based on warp factor and power (reduced to 75% of original speed)
      const baseSpeed = 2.25 * powerRef.current; // Faster base speed so it's not blank
      const warpSpeed = warpFactor * 90 * powerRef.current;
      const speed = baseSpeed + warpSpeed;

      const fov = width;

      // Enable bright glowing overlap
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        // Move star towards camera
        star.z -= speed;

        // If the star passes the camera or goes too far off-screen, reset it
        if (star.z <= 0 || Math.abs(star.x) > width * 2 || Math.abs(star.y) > height * 2) {
          resetStar(star);
          continue;
        }
        
        // Current 2D projection
        const x = (star.x / star.z) * fov + width / 2;
        const y = (star.y / star.z) * fov + height / 2;
        
        // Calculate tail length
        // The tail stretches back to where the star was when the click started
        let stretchZ = star.z + speed * 2;
        if (warpFactor > 0) {
          const warpTailZ = star.z + (star.warpStartZ - star.z) * warpFactor;
          stretchZ = Math.max(stretchZ, warpTailZ);
        }
        
        const px = (star.x / stretchZ) * fov + width / 2;
        const py = (star.y / stretchZ) * fov + height / 2;

        // Size the star based on how close it is (shrunk by 25%)
        // NO size increase during warp
        const radius = Math.max(0.375, (1 - star.z / width) * 2.25);
        
        // Fade in stars as they get closer
        let opacity = Math.max(0.1, 1 - star.z / width);

        // Make them really bright and glowy when speeding up (clicking)
        let glowAlpha = 0.3;
        let intenseGlow = false;
        if (warpFactor > 0) {
          const closeness = Math.max(0, 1 - star.z / (width * 0.5)); 
          // Boost opacity massively based on warp factor and closeness
          opacity = Math.min(1, opacity + (warpFactor * 2) + (closeness * warpFactor * 3));
          // Boost glow alpha to make it intensely bright
          glowAlpha = Math.min(1, 0.3 + (warpFactor * 2) + (closeness * warpFactor * 2));
          intenseGlow = warpFactor > 0.2;
        }

        // Create a gradient for the fading tail
        let strokeStyle: string | CanvasGradient = star.color;
        if (Math.abs(x - px) > 0.1 || Math.abs(y - py) > 0.1) {
          const grad = ctx.createLinearGradient(x, y, px, py);
          grad.addColorStop(0, star.color);
          grad.addColorStop(1, 'transparent');
          strokeStyle = grad;
        }

        // 1. Draw the stretched tail (core line)
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = radius;
        ctx.strokeStyle = strokeStyle;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        // Double stroke the core line for extreme brightness during warp
        if (intenseGlow) ctx.stroke(); 

        // 2. Draw a thicker, fainter line for the glow effect along the whole tail
        ctx.globalAlpha = opacity * glowAlpha;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = radius * 3;
        ctx.strokeStyle = strokeStyle;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 3. Add an extra wide, faint bloom effect when going fast
        if (intenseGlow) {
          ctx.lineWidth = radius * 6;
          ctx.globalAlpha = opacity * glowAlpha * 0.4;
          ctx.stroke(); 
        }

        // 4. Draw the bright head dot
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        // Double fill the head dot for extreme brightness
        if (intenseGlow) ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', initStars);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color1, color2, color3, color4]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 -z-10 pointer-events-none bg-black"
    />
  );
}
