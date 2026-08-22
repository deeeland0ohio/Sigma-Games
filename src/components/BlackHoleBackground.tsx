import React, { useEffect, useRef } from 'react';

interface BlackHoleConfig {
  speed: number;
  size: number;
  density: number;
}

export default function BlackHoleBackground({ 
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
  config?: BlackHoleConfig
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef(power);
  const configRef = useRef(config);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  const initDashesRef = useRef<() => void>(() => {});

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    initDashesRef.current();
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

    interface Dash {
      x: number;
      y: number;
      z: number;
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

    let dashes: Dash[] = [];
    
    const createDash = (xStart?: number, fixedZ?: number): Dash => {
      const palette = [color1, color2];
      if (color3) palette.push(color3);
      if (color4) palette.push(color4);
      const color = palette[Math.floor(Math.random() * palette.length)];
      
      const baseSpeed = (1 + Math.random() * 3);
      const baseLength = (10 + Math.random() * 30);
      const z = fixedZ ?? (0.15 + Math.random() * 1.05); // b64:ZGVwdGggZnJvbSAwLjE1IChmYXIpIHRvIDEuMjAgKG5lYXIp
      
      const dashY = Math.random() * height;
      return {
        x: xStart ?? Math.random() * width,
        y: dashY,
        z,
        vx: baseSpeed * (0.35 + 0.65 * z), // slow down farther background lines for 3D parallax
        vy: 0,
        baseY: dashY,
        baseSpeed,
        length: baseLength,
        color: color,
        opacity: (0.15 + Math.random() * 0.45)
      };
    };

    const initDashes = () => {
      const { density } = configRef.current;
      const densityFactor = density / 50;
      const maxDashes = Math.floor((width * height) / 2500 * densityFactor);
      dashes = [];
      for (let i = 0; i < maxDashes; i++) {
        dashes.push(createDash());
      }
      // b64:U29ydCBkYXNoZXMgYnkgeiBzbyB0aGV5IHJlbmRlciBiYWNrLXRvLWZyb250IChkZXB0aCBzb3J0ZWQp
      dashes.sort((a, b) => a.z - b.z);
    };

    initDashesRef.current = initDashes;
    initDashes();

    // b64:SW5pdGlhbGl6ZSBmbHVpZCBibG9icyBmb3IgdGhlIGFjY3JldGlvbiBkaXNr
    const blobs: FluidBlob[] = [];
    
    const getFluidColor = (c: string) => {
      if (c.includes('rgba')) {
        return c.replace(/0\.\d+\)/, '0.04)');
      } else if (c.startsWith('#')) {
        // b64:Q29udmVydCBoZXggdG8gcmdiYQ==
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
      dpr = window.devicePixelRatio || 1;
      
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      
      initDashes();
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

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

    const drawAccretionDisk = (sizeFactor: number, speedFactor: number) => {
      if (mouse.x > -1000 && powerRef.current > 0) {
        const time = Date.now() * 0.001;
        
        ctx.save();
        ctx.globalAlpha = 1.0;
        // b64:VXNlIHNjcmVlbiBibGVuZGluZyBmb3IgYSBicmlnaHQsIGZsdWlkIGxpZ2h0IGVmZmVjdA==
        ctx.globalCompositeOperation = 'screen';

        // b64:SW50ZW5zZSBpbm5lciBnYXMgZ2xvdyAoMS4yNXggbGFyZ2VyKQ==
        const innerGlowRadius = 130 * sizeFactor * 1.25;
        const innerGlow = ctx.createRadialGradient(mouse.x, mouse.y, 35 * sizeFactor * 1.25, mouse.x, mouse.y, innerGlowRadius);
        
        const intenseC1 = getIntenseColor(color1);
        const intenseC2 = getIntenseColor(color2);
        
        innerGlow.addColorStop(0, intenseC1);
        innerGlow.addColorStop(0.35, intenseC2);
        innerGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, innerGlowRadius, 0, Math.PI * 2);
        ctx.fillStyle = innerGlow;
        ctx.fill();
        
        for (let i = 0; i < blobs.length; i++) {
          const blob = blobs[i];
          blob.angle -= blob.speed * powerRef.current * speedFactor;
          
          const currentDist = (blob.dist + Math.sin(time * 2 + blob.offset) * 15) * sizeFactor * 1.25;
          const bx = mouse.x + Math.cos(blob.angle) * currentDist;
          const by = mouse.y + Math.sin(blob.angle) * currentDist;
          
          const brightness = Math.max(0, 1 - (currentDist / (90 * sizeFactor * 1.25)));
          const dynamicOpacity = (0.04 + brightness * 0.8).toFixed(2);
          const dynamicColor = blob.color.replace('0.04)', `${dynamicOpacity})`);

          const blobSize = blob.size * sizeFactor * 1.25;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blobSize);
          grad.addColorStop(0, dynamicColor);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.beginPath();
          ctx.arc(bx, by, blobSize, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const drawEventHorizon = (sizeFactor: number) => {
      if (mouse.x > -1000 && powerRef.current > 0) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        // b64:RHJhdyBwdXJlIGJsYWNrIGNlbnRlciAoZXZlbnQgaG9yaXpvbikgLSBtb3N0bHkgc29saWQgYmxhY2sgd2l0aCBhIHRpbnkgc29mdCBlZGdlIGZhZGUgKDEuM3ggbGFyZ2VyKQ==
        const centerRadius = (35 + 10) * sizeFactor * 1.3;
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, centerRadius);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.90, '#000000'); // b64:UmVtYWlucyBjb21wbGV0ZWx5IHNvbGlkIGJsYWNrIGZvciB0aGUgaW5uZXIgOTAl
        grad.addColorStop(1, 'rgba(0,0,0,0)'); // b64:U29mdCBlZGdlIGZhbGxvZmYgaW4gdGhlIG91dGVyIDEwJQ==
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, centerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const animate = () => {
      const { speed: configSpeed, size: configSize } = configRef.current;
      const speedFactor = configSpeed / 50;
      const sizeFactor = Math.max(0.1, configSize / 50);
      
      // b64:R3Jhdml0YXRpb25hbCByZWFjaCAocHVsbCByYWRpdXMpIHNjYWxlcyB3aXRoIGdsb2JhbCBlbmVyZ3kvcG93ZXI=
      const maxDist = 300 * sizeFactor * (0.6 + 0.4 * powerRef.current);

      ctx.clearRect(0, 0, width, height);

      let accretionDiskDrawn = false;
      const blackHoleZThreshold = 0.85;

      for (let i = 0; i < dashes.length; i++) {
        const dash = dashes[i];

        // b64:RHJhdyBhY2NyZXRpb24gZGlzayB3aGVuIHdlIHJlYWNoIGl0cyBaIHBsYW5lIHRvIGNyZWF0ZSBjb3JyZWN0IDNEIG92ZXJsYXAgKGxheWVycyBiZWhpbmQgdnMuIGluIGZyb250KQ==
        if (!accretionDiskDrawn && dash.z >= blackHoleZThreshold) {
          drawAccretionDisk(sizeFactor, speedFactor);
          accretionDiskDrawn = true;
        }

        // b64:M0QgZ3Jhdml0eSBjYWxjdWxhdGlvbiB1c2luZyBkZXB0aCBkaWZmZXJlbmNl
        const dx = mouse.x - dash.x;
        const dy = mouse.y - dash.y;
        
        // b64:Q2FsY3VsYXRlIGRpc3RhbmNlIGluIDNEIHNwYWNlLiBUaGUgZXZlbnQgaG9yaXpvbiBpcyBhdCB6ID0gMS4wLg==
        const depthDiff = (1.0 - dash.z) * 150;
        const dist3D = Math.sqrt(dx * dx + dy * dy + depthDiff * depthDiff);
        
        const currentBaseSpeed = dash.baseSpeed * (0.35 + 0.65 * dash.z);
        const currentLength = dash.length * Math.max(0.1, sizeFactor) * (0.3 + 0.7 * dash.z);

        const speedMult = powerRef.current === 0 ? 0.4 : powerRef.current;
        const targetBaseVx = currentBaseSpeed * speedMult;

        let influence = 0;
        if (dist3D < maxDist && dist3D > 0 && powerRef.current > 0) {
          influence = (maxDist - dist3D) / maxDist;
          // b64:Q3ViaWMgc21vb3RoaW5nIHRvIGF2b2lkIGJvdW5kYXJ5IGppdHRlci9oeXN0ZXJlc2lz
          influence = influence * influence * (3 - 2 * influence);
        }

        if (influence > 0) {
          const angle = Math.atan2(dy, dx);
          
          // b64:U21vb3RoIGdyYXZpdGF0aW9uYWwgcHVsbCBjdXJ2ZSB0aGF0IGdyb3dzIHN0cm9uZ2VyIHF1YWRyYXRpY2FsbHkgd2l0aCBnbG9iYWwgZW5lcmd5L3Bvd2Vy
          const pullForce = Math.pow(influence, 1.8) * 0.5 * Math.pow(powerRef.current, 1.5);
          
          // b64:U3dpcmwgcG9pbnRzIGlud2FyZHMgKGFuZ2xlICsgUEkvMi4zIOKJiCA3OCBkZWdyZWVzKSB0byBwcmV2ZW50IHN0YWJsZSBvcmJpdHM=
          // b64:YW5kIGd1aWRlIHBhcnRpY2xlcyBzbW9vdGhseSBpbnRvIHRoZSBldmVudCBob3Jpem9uIGNlbnRlci4=
          const swirlAngle = angle + Math.PI / 2.3; 
          const swirlForce = Math.pow(influence, 1.5) * 1.2 * Math.pow(powerRef.current, 1.5) * speedFactor;

          const bhAccX = Math.cos(angle) * pullForce + Math.cos(swirlAngle) * swirlForce;
          const bhAccY = Math.sin(angle) * pullForce + Math.sin(swirlAngle) * swirlForce;

          dash.vx += bhAccX;
          dash.vy += bhAccY;
          
          // b64:Qm9vc3Qgb3BhY2l0eSBvbiBhcHByb2FjaCBkdWUgdG8gY29tcHJlc3Npb24=
          ctx.globalAlpha = Math.min(dash.opacity + influence * 1.5, 1.0) * (0.2 + 0.8 * dash.z);

          // b64:UmVzZXQgaWYgaXQgZ2V0cyB0b28gY2xvc2UgaW4gMkQgc3BhY2UgYW5kIGl0cyBkZXB0aCBtYXRjaGVzIHRoZSBob3Jpem9uIHN3YWxsb3cgZGVwdGg=
          const dist2D = Math.sqrt(dx * dx + dy * dy);
          if (dist2D < 25 * sizeFactor && Math.abs(1.0 - dash.z) < 0.3) {
            Object.assign(dash, createDash(-50, dash.z));
            dash.baseY = dash.y;
          }
        } else {
          ctx.globalAlpha = dash.opacity * (0.2 + 0.8 * dash.z);
        }

        // b64:U2VhbWxlc3MgcmV0dXJuIHRvIGhvcml6b250YWwgZmxvdywgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgZ3Jhdml0YXRpb25hbCBpbmZsdWVuY2U=
        const returnFactor = 1.0 - influence;
        dash.vy += (0 - dash.vy) * 0.05 * returnFactor;
        dash.vx += (targetBaseVx - dash.vx) * 0.05 * returnFactor;
        dash.y += (dash.baseY - dash.y) * 0.02 * returnFactor;

        // b64:VmVsb2NpdHkgY2VpbGluZyBzY2FsZWQgYnkgbXVsdGlwbGllciBhbmQgZGVwdGggKGJhY2tncm91bmQgbGluZXMgbW92ZSBzbG93ZXIp
        const currentSpeed = Math.sqrt(dash.vx * dash.vx + dash.vy * dash.vy);
        const limitMult = powerRef.current === 0 ? 0.4 : powerRef.current;
        const maxSpeed = 6 * limitMult * Math.max(1, speedFactor) * (0.4 + 0.6 * dash.z);
        if (currentSpeed > maxSpeed) {
          dash.vx = (dash.vx / currentSpeed) * maxSpeed;
          dash.vy = (dash.vy / currentSpeed) * maxSpeed;
        }

        dash.x += dash.vx;
        dash.y += dash.vy;

        // b64:U2NyZWVuIGJvdW5kYXJ5IHdyYXAtYXJvdW5k
        if (dash.x > width + currentLength) {
          Object.assign(dash, createDash(-50, dash.z));
          dash.baseY = dash.y;
        }

        // b64:RHJhdyB0aGUgbGluZSBhbGlnbmVkIHdpdGggaXRzIGN1cnJlbnQgaGVhZGluZw==
        const drawAngle = Math.atan2(dash.vy, dash.vx);
        ctx.beginPath();
        ctx.moveTo(dash.x, dash.y);
        ctx.lineTo(dash.x + Math.cos(drawAngle) * currentLength, dash.y + Math.sin(drawAngle) * currentLength);
        ctx.strokeStyle = dash.color;
        ctx.lineWidth = (0.5 + 2.0 * dash.z);
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // b64:RW5zdXJlIGFjY3JldGlvbiBkaXNrIGlzIGRyYXduIGV2ZW4gaWYgbm8gZm9yZWdyb3VuZCBkYXNoZXMgZXhpc3Q=
      if (!accretionDiskDrawn) {
        drawAccretionDisk(sizeFactor, speedFactor);
      }

      // b64:RHJhdyB0aGUgcHVyZSBibGFjayBldmVudCBob3Jpem9uIGxhc3Qgb24gdG9wIG9mIGFsbCBkYXNoZXMgYW5kIGFjY3JldGlvbiBnYXM=
      drawEventHorizon(sizeFactor);

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
