function initDotBackground() {
      const canvas = document.getElementById("bg-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = window.devicePixelRatio || 1;

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);

      let mouse = { x: -1000, y: -1000 };
      const shockwaves = [];

      const config = {
        speed: 40,   
        size: 2,     
        density: 35  
      };
      const power = 0.8; 

      const color1 = "rgba(239, 68, 68, 0.4)";    
      const color2 = "rgba(16, 185, 129, 0.4)";   
      const color3 = "rgba(239, 68, 68, 0.4)";    
      const color4 = "rgba(16, 185, 129, 0.4)";   

      const dots = [];

      function handleMouseMove(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }

      function handleMouseLeave() {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      function handleCanvasClick(e) {
        if (e.target && e.target.closest("button, a, input, select, option, [role='button']")) {
          return;
        }
        shockwaves.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          maxRadius: Math.max(width, height) * 0.5 * power,
          speed: 20 * Math.sqrt(power),
          force: 10 * power
        });
      }

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseout", handleMouseLeave);
      window.addEventListener("click", handleCanvasClick);

      function initDots() {
        dots.length = 0;
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = window.devicePixelRatio || 1;

        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);

        const spacing = config.density;
        const palette = [color1, color2];

        for (let x = 0; x < width + spacing; x += spacing) {
          for (let y = 0; y < height + spacing; y += spacing) {
            const color = palette[Math.floor(Math.random() * palette.length)];
            dots.push({
              x, y,
              baseX: x, baseY: y,
              vx: 0, vy: 0,
              color
            });
          }
        }
      }

      initDots();
      window.addEventListener("resize", initDots);

      function parseToRgba(colorStr, alpha) {
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

      function animate() {
        const stepSpeed = config.speed / 1000;
        ctx.clearRect(0, 0, width, height);

        const driftTime = Date.now() * 0.0000195;

        const bx1 = width * 0.25 + Math.sin(driftTime * 0.5) * width * 0.15;
        const by1 = height * 0.25 + Math.cos(driftTime * 0.4) * height * 0.15;
        const r1 = Math.max(width, height) * 0.5;

        const bx2 = width * 0.75 + Math.sin(driftTime * -0.4) * width * 0.15;
        const by2 = height * 0.75 + Math.cos(driftTime * 0.5) * height * 0.15;
        const r2 = Math.max(width, height) * 0.5;

        const bx3 = width * 0.7 + Math.sin(driftTime * 0.6) * width * 0.15;
        const by3 = height * 0.3 + Math.cos(driftTime * -0.5) * height * 0.15;
        const r3 = Math.max(width, height) * 0.45;

        const bx4 = width * 0.3 + Math.sin(driftTime * -0.6) * width * 0.15;
        const by4 = height * 0.7 + Math.cos(driftTime * 0.4) * height * 0.15;
        const r4 = Math.max(width, height) * 0.5;

        function drawBlob(cx, cy, radius, col, maxAlpha) {
          if (radius <= 0) return;
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, parseToRgba(col, maxAlpha));
          gradient.addColorStop(0.5, parseToRgba(col, maxAlpha * 0.4));
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        drawBlob(bx1, by1, r1, color1, 0.065);
        drawBlob(bx2, by2, r2, color2, 0.055);
        drawBlob(bx3, by3, r3, color3 || color1, 0.06);
        drawBlob(bx4, by4, r4, color4 || color2, 0.055);

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
        ctx.lineWidth = 0.4;
        for (let x = 0; x < width; x += config.density) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += config.density) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        for (let j = shockwaves.length - 1; j >= 0; j--) {
          const sw = shockwaves[j];
          sw.radius += sw.speed;
          if (sw.radius >= sw.maxRadius) {
            shockwaves.splice(j, 1);
          }
        }

        const maxDistance = 120 * Math.sqrt(power);
        const brightnessRadius = 150 * Math.sqrt(power);
        const baseRadius = config.size;

        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];

          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance && distance > 0) {
            const force = (maxDistance - distance) / maxDistance;
            const angle = Math.atan2(dy, dx);
            dot.vx -= Math.cos(angle) * force * 1.5 * power;
            dot.vy -= Math.sin(angle) * force * 1.5 * power;
          }

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

          const swayVal = Date.now() * 0.0008;
          const swayX = Math.sin(swayVal + dot.baseX * 0.01) * 6.0;
          const swayY = Math.cos(swayVal + dot.baseY * 0.01) * 6.0;

          dot.vx += (dot.baseX + swayX - dot.x) * stepSpeed;
          dot.vy += (dot.baseY + swayY - dot.y) * stepSpeed;

          dot.vx *= 0.82;
          dot.vy *= 0.82;

          dot.x += dot.vx;
          dot.y += dot.vy;
        }

        ctx.fillStyle = color1;
        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (dot.color !== color1) continue;

          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let active = distance < brightnessRadius;
          if (!active) {
            for (let j = 0; j < shockwaves.length; j++) {
              const sw = shockwaves[j];
              const sdx = dot.x - sw.x;
              const sdy = dot.y - sw.y;
              const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
              if (Math.abs(sdist - sw.radius) < 40) {
                active = true;
                break;
              }
            }
          }

          if (!active) {
            ctx.moveTo(dot.x + baseRadius, dot.y);
            ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
          }
        }
        ctx.fill();

        ctx.fillStyle = color2;
        ctx.beginPath();
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          if (dot.color === color1) continue;

          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let active = distance < brightnessRadius;
          if (!active) {
            for (let j = 0; j < shockwaves.length; j++) {
              const sw = shockwaves[j];
              const sdx = dot.x - sw.x;
              const sdy = dot.y - sw.y;
              const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
              if (Math.abs(sdist - sw.radius) < 40) {
                active = true;
                break;
              }
            }
          }

          if (!active) {
            ctx.moveTo(dot.x + baseRadius, dot.y);
            ctx.arc(dot.x, dot.y, baseRadius, 0, Math.PI * 2);
          }
        }
        ctx.fill();

        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let brightness = 1;
          let scale = 1;
          if (distance < brightnessRadius) {
            const influence = 1 - distance / brightnessRadius;
            brightness = 1 + influence * 2;
            scale = 1 + influence * 0.5;
          }

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

          if (brightness > 1) {
            const r = baseRadius * scale;
            const opacity = Math.min(1.0, 0.45 * brightness);

            ctx.beginPath();
            ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
            ctx.fillStyle = parseToRgba(dot.color, opacity);
            ctx.fill();
          }
        }

        requestAnimationFrame(animate);
      }

      animate();
    }
