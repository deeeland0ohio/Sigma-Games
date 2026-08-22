import React, { useEffect, useRef } from 'react';

interface LightspeedConfig {
  speed: number;
  size: number;
  density: number;
}

export default function LightspeedBackground({ 
  color1, 
  color2, 
  color3, 
  color4, 
  power = 1.0,
  config = { speed: 50, size: 50, density: 50 }
}: { 
  color1: string, 
  color2: string, 
  color3?: string, 
  color4?: string, 
  power?: number,
  config?: LightspeedConfig
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef(power);
  const configRef = useRef(config);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  const initStarsRef = useRef<() => void>(() => {});

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    initStarsRef.current();
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

    let isMouseDown = false;
    let warpFactor = 0;

    const stars: { x: number, y: number, z: number, color: string, warpStartZ: number }[] = [];

    const pickColor = () => {
      const palette = [color1, color2];
      if (color3) palette.push(color3);
      if (color4) palette.push(color4);
      return palette[Math.floor(Math.random() * palette.length)];
    };

    const resetStar = (star: { x: number, y: number, z: number, color: string, warpStartZ: number }) => {
      const angle = Math.random() * Math.PI * 2;
      // b64:S2VlcCBzdGFycyBhd2F5IGZyb20gdGhlIGNlbnRlciBPTkxZIHdoZW4gY2xpY2tpbmcvd2FycGluZw==
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
      const { density } = configRef.current;
      const densityFactor = density / 50;
      const numStars = Math.floor(1440 * densityFactor);

      stars.length = 0;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      
      for (let i = 0; i < numStars; i++) {
        const star = { x: 0, y: 0, z: 0, color: pickColor(), warpStartZ: 0 };
        resetStar(star);
        star.z = Math.random() * width; // b64:UmFuZG9taXplIGluaXRpYWwgZGVwdGg=
        star.warpStartZ = star.z;
        stars.push(star);
      }
    };

    initStarsRef.current = initStars;
    initStars();
    window.addEventListener('resize', initStars);

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select, label, [role="button"], [role="switch"]')) {
        return;
      }
      isMouseDown = true;
      // b64:QW5jaG9yIHRoZSBzdGFydCBvZiB0aGUgdGFpbCB0byBjdXJyZW50IHBvc2l0aW9uIHdoZW4gY2xpY2tpbmc=
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

      const { speed: configSpeed, size: configSize } = configRef.current;
      const speedFactor = configSpeed / 50;
      const sizeFactor = configSize / 50;

      // b64:NS4wIHNlY29uZHMgdG8gcmVhY2ggbWF4IHNwZWVkIHdoZW4gY2xpY2tpbmc=
      // b64:MS41IHNlY29uZHMgdG8gc2xvdyBkb3duIHdoZW4gcmVsZWFzaW5n
      if (isMouseDown) {
        warpFactor = Math.min(1, warpFactor + dt / 5.0);
      } else {
        warpFactor = Math.max(0, warpFactor - dt / 1.5);
      }

      // b64:RGFyayBiYWNrZ3JvdW5kIHdpdGggYSBmYXN0IHRyYWlsIGVmZmVjdCB0byBwcmV2ZW50IHN0YW1wZWQgY2lyY2xlcw==
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = `rgba(0, 0, 0, 0.4)`; 
      ctx.fillRect(0, 0, width, height);

      // b64:Q2FsY3VsYXRlIHNwZWVkIGJhc2VkIG9uIHdhcnAgZmFjdG9yIGFuZCBwb3dlciAocmVkdWNlZCB0byA3NSUgb2Ygb3JpZ2luYWwgc3BlZWQp
      const baseSpeed = 2.25 * powerRef.current * speedFactor; // b64:RmFzdGVyIGJhc2Ugc3BlZWQgc28gaXQncyBub3QgYmxhbms=
      const warpSpeed = warpFactor * 90 * powerRef.current * speedFactor;
      const speed = baseSpeed + warpSpeed;

      const fov = width;

      // b64:RW5hYmxlIGJyaWdodCBnbG93aW5nIG92ZXJsYXA=
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        // b64:TW92ZSBzdGFyIHRvd2FyZHMgY2FtZXJh
        star.z -= speed;

        // b64:SWYgdGhlIHN0YXIgcGFzc2VzIHRoZSBjYW1lcmEgb3IgZ29lcyB0b28gZmFyIG9mZi1zY3JlZW4sIHJlc2V0IGl0
        if (star.z <= 0 || Math.abs(star.x) > width * 2 || Math.abs(star.y) > height * 2) {
          resetStar(star);
          continue;
        }
        
        // b64:Q3VycmVudCAyRCBwcm9qZWN0aW9u
        const x = (star.x / star.z) * fov + width / 2;
        const y = (star.y / star.z) * fov + height / 2;
        
        // b64:Q2FsY3VsYXRlIHRhaWwgbGVuZ3Ro
        // b64:VGhlIHRhaWwgc3RyZXRjaGVzIGJhY2sgdG8gd2hlcmUgdGhlIHN0YXIgd2FzIHdoZW4gdGhlIGNsaWNrIHN0YXJ0ZWQ=
        let stretchZ = star.z + speed * 2;
        if (warpFactor > 0) {
          const warpTailZ = star.z + (star.warpStartZ - star.z) * warpFactor;
          stretchZ = Math.max(stretchZ, warpTailZ);
        }
        
        const px = (star.x / stretchZ) * fov + width / 2;
        const py = (star.y / stretchZ) * fov + height / 2;

        // b64:U2l6ZSB0aGUgc3RhciBiYXNlZCBvbiBob3cgY2xvc2UgaXQgaXMgKHNocnVuayBieSAyNSUp
        // b64:Tk8gc2l6ZSBpbmNyZWFzZSBkdXJpbmcgd2FycA==
        const radius = Math.max(0.375, (1 - star.z / width) * 2.25) * sizeFactor;
        
        // b64:RmFkZSBpbiBzdGFycyBhcyB0aGV5IGdldCBjbG9zZXI=
        let opacity = Math.max(0.1, 1 - star.z / width);

        // b64:TWFrZSB0aGVtIHJlYWxseSBicmlnaHQgYW5kIGdsb3d5IHdoZW4gc3BlZWRpbmcgdXAgKGNsaWNraW5nKQ==
        let glowAlpha = 0.3;
        let intenseGlow = false;
        if (warpFactor > 0) {
          const closeness = Math.max(0, 1 - star.z / (width * 0.5)); 
          // b64:Qm9vc3Qgb3BhY2l0eSBtYXNzaXZlbHkgYmFzZWQgb24gd2FycCBmYWN0b3IgYW5kIGNsb3NlbmVzcw==
          opacity = Math.min(1, opacity + (warpFactor * 2) + (closeness * warpFactor * 3));
          // b64:Qm9vc3QgZ2xvdyBhbHBoYSB0byBtYWtlIGl0IGludGVuc2VseSBicmlnaHQ=
          glowAlpha = Math.min(1, 0.3 + (warpFactor * 2) + (closeness * warpFactor * 2));
          intenseGlow = warpFactor > 0.2;
        }

        // b64:Q3JlYXRlIGEgZ3JhZGllbnQgZm9yIHRoZSBmYWRpbmcgdGFpbA==
        let strokeStyle: string | CanvasGradient = star.color;
        if (Math.abs(x - px) > 0.1 || Math.abs(y - py) > 0.1) {
          const grad = ctx.createLinearGradient(x, y, px, py);
          grad.addColorStop(0, star.color);
          grad.addColorStop(1, 'transparent');
          strokeStyle = grad;
        }

        // b64:MS4gRHJhdyB0aGUgc3RyZXRjaGVkIHRhaWwgKGNvcmUgbGluZSk=
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = radius;
        ctx.strokeStyle = strokeStyle;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        // b64:RG91YmxlIHN0cm9rZSB0aGUgY29yZSBsaW5lIGZvciBleHRyZW1lIGJyaWdodG5lc3MgZHVyaW5nIHdhcnA=
        if (intenseGlow) ctx.stroke(); 

        // b64:Mi4gRHJhdyBhIHRoaWNrZXIsIGZhaW50ZXIgbGluZSBmb3IgdGhlIGdsb3cgZWZmZWN0IGFsb25nIHRoZSB3aG9sZSB0YWls
        ctx.globalAlpha = opacity * glowAlpha;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = radius * 3;
        ctx.strokeStyle = strokeStyle;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // b64:My4gQWRkIGFuIGV4dHJhIHdpZGUsIGZhaW50IGJsb29tIGVmZmVjdCB3aGVuIGdvaW5nIGZhc3Q=
        if (intenseGlow) {
          ctx.lineWidth = radius * 6;
          ctx.globalAlpha = opacity * glowAlpha * 0.4;
          ctx.stroke(); 
        }

        // b64:NC4gRHJhdyB0aGUgYnJpZ2h0IGhlYWQgZG90
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        // b64:RG91YmxlIGZpbGwgdGhlIGhlYWQgZG90IGZvciBleHRyZW1lIGJyaWdodG5lc3M=
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
