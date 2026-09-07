import React, { useEffect, useRef } from 'react';

export interface FluidConfig {
  curl: number;        // Swirl / vorticity (1 - 100)
  dissipation: number; // Fade speed / dissipation rate (1 - 100)
  splatRadius: number; // Size of injected fluid splats (1 - 100)
  speed: number;       // Simulation speed multiplier (1 - 100)
}

interface FluidBackgroundProps {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  palette?: string[];
  power?: number;
  config?: FluidConfig;
}

function parseColorToRgb(colorStr?: string, fallback: [number, number, number] = [1.0, 0.55, 0.1]): [number, number, number] {
  if (!colorStr) return fallback;
  
  if (colorStr.startsWith('#')) {
    const c = colorStr.slice(1);
    if (c.length === 3) {
      return [
        parseInt(c[0] + c[0], 16) / 255,
        parseInt(c[1] + c[1], 16) / 255,
        parseInt(c[2] + c[2], 16) / 255,
      ];
    }
    if (c.length >= 6) {
      return [
        parseInt(c.slice(0, 2), 16) / 255,
        parseInt(c.slice(2, 4), 16) / 255,
        parseInt(c.slice(4, 6), 16) / 255,
      ];
    }
  }

  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10) / 255,
      parseInt(rgbMatch[2], 10) / 255,
      parseInt(rgbMatch[3], 10) / 255,
    ];
  }

  return fallback;
}

function getGradientColor(palette: [number, number, number][], timeSec: number, secPerColor: number = 1.5): [number, number, number] {
  if (!palette || palette.length === 0) return [1.0, 0.55, 0.1];
  if (palette.length === 1) return palette[0];

  const totalCycle = palette.length * secPerColor;
  const normTime = ((timeSec % totalCycle) + totalCycle) % totalCycle;
  const progress = normTime / secPerColor;
  const idx1 = Math.floor(progress) % palette.length;
  const idx2 = (idx1 + 1) % palette.length;
  const rawFrac = progress - Math.floor(progress);
  
  // Smooth cosine s-curve interpolation
  const frac = (1 - Math.cos(rawFrac * Math.PI)) * 0.5;

  const c1 = palette[idx1];
  const c2 = palette[idx2];

  return [
    c1[0] + (c2[0] - c1[0]) * frac,
    c1[1] + (c2[1] - c1[1]) * frac,
    c1[2] + (c2[2] - c1[2]) * frac,
  ];
}

export default function FluidBackground({
  color1,
  color2,
  color3,
  color4,
  palette,
  power = 1.0,
  config = { curl: 8, dissipation: 70, splatRadius: 40, speed: 40 }
}: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  const powerRef = useRef(power);
  const colorsRef = useRef<{ color1?: string; color2?: string; color3?: string; color4?: string; palette?: string[] }>({ color1, color2, color3, color4, palette });

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  useEffect(() => {
    colorsRef.current = { color1, color2, color3, color4, palette };
  }, [color1, color2, color3, color4, palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    try {
      const glOpts = {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      };
      gl = (canvas.getContext('webgl2', glOpts) ||
            canvas.getContext('webgl', glOpts) ||
            canvas.getContext('experimental-webgl', glOpts)) as WebGLRenderingContext;
    } catch (e) {
      gl = null;
    }

    // 2D Fallback if WebGL context creation failed
    if (!gl) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        color: [number, number, number];
        alpha: number;
        decay: number;
      }

      const particles: Particle[] = [];
      let lastX = -1;
      let lastY = -1;
      const startTime = performance.now();

      const onMove = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        if (lastX < 0) { lastX = x; lastY = y; }
        const vx = (x - lastX) * 0.4;
        const vy = (y - lastY) * 0.4;
        const dist = Math.hypot(x - lastX, y - lastY);
        const steps = Math.max(1, Math.min(12, Math.ceil(dist / 14)));
        const elapsedSec = (performance.now() - startTime) / 1000;

        const palette = [
          parseColorToRgb(colorsRef.current.color1, [1.0, 0.6, 0.1]),
          parseColorToRgb(colorsRef.current.color2, [1.0, 0.25, 0.05]),
          parseColorToRgb(colorsRef.current.color3, [0.95, 0.8, 0.15]),
          parseColorToRgb(colorsRef.current.color4, [0.85, 0.15, 0.0]),
        ];
        const curColor = getGradientColor(palette, elapsedSec, 1.5);

        for (let i = 1; i <= steps; i++) {
          const px = lastX + (x - lastX) * (i / steps);
          const py = lastY + (y - lastY) * (i / steps);
          particles.push({
            x: px,
            y: py,
            vx: vx * 0.6 + (Math.random() - 0.5) * 0.8,
            vy: vy * 0.6 + (Math.random() - 0.5) * 0.8,
            radius: 30 + (configRef.current.splatRadius / 40) * 25,
            color: curColor,
            alpha: 0.85,
            decay: 0.008 + (configRef.current.dissipation / 100) * 0.015,
          });
        }
        lastX = x;
        lastY = y;
      };

      window.addEventListener('mousemove', onMove);

      const render2D = () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.alpha -= p.decay;
          p.radius += 0.4;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          const r = Math.round(p.color[0] * 255);
          const g = Math.round(p.color[1] * 255);
          const b = Math.round(p.color[2] * 255);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.49})`);
          grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.16})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render2D);
      };
      render2D();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', onMove);
      };
    }

    // --- WebGL Navier-Stokes Fluid Engine with Turbulence & Self-Collision ---
    const isWebGL2 = 'WebGL2RenderingContext' in window && gl instanceof WebGL2RenderingContext;
    
    // Extensions
    let halfFloatExt: any = null;
    let floatExt: any = null;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloatExt = gl.getExtension('OES_texture_half_float');
      gl.getExtension('OES_texture_half_float_linear');
      floatExt = gl.getExtension('OES_texture_float');
      gl.getExtension('OES_texture_float_linear');
      gl.getExtension('WEBGL_color_buffer_float');
      gl.getExtension('EXT_color_buffer_half_float');
    }

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error('Shader compile error:', glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(glCtx: WebGLRenderingContext, vertSrc: string, fragSrc: string) {
      const vert = createShader(glCtx, glCtx.VERTEX_SHADER, vertSrc);
      const frag = createShader(glCtx, glCtx.FRAGMENT_SHADER, fragSrc);
      if (!vert || !frag) return null;
      const prog = glCtx.createProgram();
      if (!prog) return null;
      glCtx.attachShader(prog, vert);
      glCtx.attachShader(prog, frag);
      glCtx.linkProgram(prog);
      if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) {
        console.error('Program link error:', glCtx.getProgramInfoLog(prog));
        glCtx.deleteProgram(prog);
        return null;
      }
      return prog;
    }

    const baseVertexShader = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // Organic Fluid Splat Shader: uses fractal turbulent noise inside an invisible circle boundary
    // around the cursor, creating organic fluid-like shapes without spawning far from the pointer.
    const splatShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      uniform vec2 velocity;
      uniform float seed;

      // 2D Hash
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // Smooth Value Noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                       dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
                   mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                       dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
      }

      // 2-Octave Fractal Noise for fluid tendril contours
      float fbm(vec2 p) {
        float v = 0.0;
        v += 0.65 * noise(p);
        v += 0.35 * noise(p * 2.1 + vec2(1.7, 3.2));
        return v;
      }

      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;

        // Strict invisible circular bounding cutoff around the cursor
        float cursorDistSq = dot(p, p);
        float maxCircleRadiusSq = radius * 3.4;
        if (cursorDistSq > maxCircleRadiusSq) {
          gl_FragColor = texture2D(uTarget, vUv);
          return;
        }

        // Smooth circular boundary falloff
        float circleMask = smoothstep(maxCircleRadiusSq, maxCircleRadiusSq * 0.45, cursorDistSq);

        // Directional motion stretching
        float speed = length(velocity);
        if (speed > 0.001) {
          vec2 dir = velocity / speed;
          float along = dot(p, dir);
          float across = dot(p, vec2(-dir.y, dir.x));
          p = dir * along * 0.8 + vec2(-dir.y, dir.x) * across * 1.25;
        }

        // Fluid noise distortion contained within the invisible circle
        vec2 noiseCoord = (vUv - point.xy) * 24.0 + vec2(seed * 7.13, seed * 13.91);
        float n = fbm(noiseCoord);
        vec2 offset = vec2(sin(n * 6.28318), cos(n * 6.28318)) * 0.007 * (1.0 + n * 0.5);
        vec2 distortedP = p + offset;

        float distSq = dot(distortedP, distortedP);
        float baseSplat = exp(-distSq / radius);
        
        // Modulate edge with smoke wisps and apply circular cutoff mask
        float wisp = 0.85 + 0.3 * noise(noiseCoord * 1.8);
        vec3 splat = baseSplat * wisp * color * circleMask;

        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    // Velocity & Dye Advection with Boundary Clamping and CFL Stability
    const advectionShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;

      void main () {
        // Sample velocity and clamp magnitude to strictly prevent explosive runaway spikes
        vec2 vel = texture2D(uVelocity, vUv).xy;
        float speed = length(vel);
        if (speed > 35.0) {
          vel = (vel / speed) * 35.0;
        }

        vec2 coord = vUv - dt * vel * texelSize;
        
        // Clamp to avoid border artifacts
        coord = clamp(coord, texelSize * 0.5, vec2(1.0) - texelSize * 0.5);

        // Boundary damping: fade at edge
        float edgeDamp = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x) *
                         smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);

        gl_FragColor = dissipation * edgeDamp * texture2D(uSource, coord);
      }
    `;

    // Divergence Shader
    const divergenceShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform vec2 texelSize;

      void main () {
        float L = texture2D(uVelocity, clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float R = texture2D(uVelocity, clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float T = texture2D(uVelocity, clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)).y;
        float B = texture2D(uVelocity, clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)).y;

        // No-slip boundary condition at walls
        if (vUv.x - texelSize.x < 0.0) L = -texture2D(uVelocity, vUv).x;
        if (vUv.x + texelSize.x > 1.0) R = -texture2D(uVelocity, vUv).x;
        if (vUv.y - texelSize.y < 0.0) B = -texture2D(uVelocity, vUv).y;
        if (vUv.y + texelSize.y > 1.0) T = -texture2D(uVelocity, vUv).y;

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    // Vorticity (Curl) Shader
    const curlShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform vec2 texelSize;

      void main () {
        float L = texture2D(uVelocity, clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)).y;
        float R = texture2D(uVelocity, clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)).y;
        float T = texture2D(uVelocity, clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float B = texture2D(uVelocity, clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;

    // Vorticity Confinement (creates natural swirling eddies and curling vortex filaments)
    const vorticityShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      uniform vec2 texelSize;

      void main () {
        float L = texture2D(uCurl, clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float R = texture2D(uCurl, clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float T = texture2D(uCurl, clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float B = texture2D(uCurl, clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        float lengthSquared = max(dot(force, force), 1e-5);
        force = force / sqrt(lengthSquared);
        force *= curl * C * vec2(1.0, -1.0);

        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `;

    // Pressure Poisson Solver (Jacobi iteration with boundary condition)
    const pressureShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      uniform vec2 texelSize;

      void main () {
        float L = texture2D(uPressure, clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float R = texture2D(uPressure, clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float T = texture2D(uPressure, clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float B = texture2D(uPressure, clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float div = texture2D(uDivergence, vUv).x;
        
        float p = (L + R + T + B - div) * 0.25;
        gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
      }
    `;

    // Gradient Subtraction: enforces mass conservation so fluid pushes surrounding liquid & smoke
    const gradientSubtractShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      uniform vec2 texelSize;

      void main () {
        float L = texture2D(uPressure, clamp(vUv - vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float R = texture2D(uPressure, clamp(vUv + vec2(texelSize.x, 0.0), 0.0, 1.0)).x;
        float T = texture2D(uPressure, clamp(vUv + vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        float B = texture2D(uPressure, clamp(vUv - vec2(0.0, texelSize.y), 0.0, 1.0)).x;
        
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vel.xy -= vec2(R - L, T - B) * 0.5;

        // No-slip boundary at screen edges
        if (vUv.x < texelSize.x || vUv.x > 1.0 - texelSize.x) vel.x = 0.0;
        if (vUv.y < texelSize.y || vUv.y > 1.0 - texelSize.y) vel.y = 0.0;

        gl_FragColor = vec4(vel, 0.0, 1.0);
      }
    `;

    // Display Shader: renders luminous glowing smoke plumes matching reference images (35% less bright)
    const displayShader = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        
        // High dynamic range tone mapping: 35% less bright with deep, pitch-black background
        vec3 col = c * 0.94;
        col = pow(col, vec3(1.08));
        
        // Soft vignette at outer bounds
        vec2 uv = vUv * (1.0 - vUv.yx);
        float vig = uv.x * uv.y * 15.0;
        vig = clamp(pow(vig, 0.15), 0.0, 1.0);
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const splatProg = createProgram(gl, baseVertexShader, splatShader);
    const advectionProg = createProgram(gl, baseVertexShader, advectionShader);
    const divergenceProg = createProgram(gl, baseVertexShader, divergenceShader);
    const curlProg = createProgram(gl, baseVertexShader, curlShader);
    const vorticityProg = createProgram(gl, baseVertexShader, vorticityShader);
    const pressureProg = createProgram(gl, baseVertexShader, pressureShader);
    const gradSubProg = createProgram(gl, baseVertexShader, gradientSubtractShader);
    const displayProg = createProgram(gl, baseVertexShader, displayShader);

    if (!splatProg || !advectionProg || !divergenceProg || !curlProg || !vorticityProg || !pressureProg || !gradSubProg || !displayProg) {
      return;
    }

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // Determine texture format with explicit FBO validation check
    let textureType: number = gl.UNSIGNED_BYTE;
    let internalFormat: number = gl.RGBA;
    if (isWebGL2) {
      textureType = (gl as WebGL2RenderingContext).HALF_FLOAT;
      internalFormat = (gl as WebGL2RenderingContext).RGBA16F;
    } else if (halfFloatExt) {
      textureType = halfFloatExt.HALF_FLOAT_OES;
      internalFormat = gl.RGBA;
    } else if (floatExt) {
      textureType = gl.FLOAT;
      internalFormat = gl.RGBA;
    }

    function createFBO(glCtx: WebGLRenderingContext, w: number, h: number, type: number, intFormat: number) {
      glCtx.activeTexture(glCtx.TEXTURE0);
      const texture = glCtx.createTexture();
      glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);

      if (isWebGL2) {
        (glCtx as WebGL2RenderingContext).texImage2D(
          glCtx.TEXTURE_2D, 0, intFormat, w, h, 0, glCtx.RGBA, type, null
        );
      } else {
        glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, w, h, 0, glCtx.RGBA, type, null);
      }

      const fbo = glCtx.createFramebuffer();
      glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo);
      glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, texture, 0);
      glCtx.viewport(0, 0, w, h);
      glCtx.clearColor(0, 0, 0, 1);
      glCtx.clear(glCtx.COLOR_BUFFER_BIT);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        attach(id: number) {
          glCtx.activeTexture(glCtx.TEXTURE0 + id);
          glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
          return id;
        }
      };
    }

    function createDoubleFBO(glCtx: WebGLRenderingContext, w: number, h: number, type: number, intFormat: number) {
      let fbo1 = createFBO(glCtx, w, h, type, intFormat);
      let fbo2 = createFBO(glCtx, w, h, type, intFormat);
      return {
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        get read() { return fbo1; },
        set read(val) { fbo1 = val; },
        get write() { return fbo2; },
        set write(val) { fbo2 = val; },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        }
      };
    }

    const simRes = 256;
    const dyeRes = 512;

    const density = createDoubleFBO(gl, dyeRes, dyeRes, textureType, internalFormat);
    const velocity = createDoubleFBO(gl, simRes, simRes, textureType, internalFormat);
    const divergence = createFBO(gl, simRes, simRes, textureType, internalFormat);
    const curl = createFBO(gl, simRes, simRes, textureType, internalFormat);
    const pressure = createDoubleFBO(gl, simRes, simRes, textureType, internalFormat);

    const blit = (destinationFBO: WebGLFramebuffer | null, w: number, h: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, destinationFBO);
      gl.viewport(0, 0, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let seedCounter = 0;
    function executeSplat(
      x: number,
      y: number,
      dx: number,
      dy: number,
      color: [number, number, number],
      radiusFactor: number
    ) {
      if (!splatProg) return;
      gl.useProgram(splatProg);
      const aspect = canvas.width / canvas.height;
      const baseRadius = (configRef.current.splatRadius / 40) * 0.0016 + 0.0004;
      const rad = baseRadius * radiusFactor;
      seedCounter = (seedCounter + 0.173) % 100.0;

      // Clamp injected velocity magnitude to keep Navier-Stokes solver stable without high-speed glitching
      const velMag = Math.hypot(dx, dy);
      const clampedMag = Math.min(velMag, 18.0);
      const normVx = velMag > 0.001 ? (dx / velMag) * clampedMag : 0;
      const normVy = velMag > 0.001 ? (dy / velMag) * clampedMag : 0;

      // 1. Splat into Velocity Field
      gl.uniform1i(gl.getUniformLocation(splatProg, 'uTarget'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(splatProg, 'aspectRatio'), aspect);
      gl.uniform2f(gl.getUniformLocation(splatProg, 'point'), x, y);
      gl.uniform2f(gl.getUniformLocation(splatProg, 'velocity'), normVx, normVy);
      gl.uniform3f(gl.getUniformLocation(splatProg, 'color'), normVx * 1.8, normVy * 1.8, 0.0);
      gl.uniform1f(gl.getUniformLocation(splatProg, 'radius'), rad * 1.3);
      gl.uniform1f(gl.getUniformLocation(splatProg, 'seed'), seedCounter);
      blit(velocity.write.fbo, velocity.width, velocity.height);
      velocity.swap();

      // 2. Splat into Dye Field (35% reduced brightness)
      gl.uniform1i(gl.getUniformLocation(splatProg, 'uTarget'), density.read.attach(0));
      gl.uniform3f(gl.getUniformLocation(splatProg, 'color'), color[0] * 0.91, color[1] * 0.91, color[2] * 0.91);
      gl.uniform1f(gl.getUniformLocation(splatProg, 'radius'), rad);
      blit(density.write.fbo, density.width, density.height);
      density.swap();
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Pointer Interaction Handling (Smooth Sub-step Ribbon Injection)
    let prevPointerX = -1;
    let prevPointerY = -1;
    const simStartTime = performance.now();

    const getCurrentGradientColor = (timeSec: number): [number, number, number] => {
      let rawColors = colorsRef.current.palette;
      if (!rawColors || rawColors.length === 0) {
        rawColors = [
          colorsRef.current.color1,
          colorsRef.current.color2,
          colorsRef.current.color3,
          colorsRef.current.color4,
        ].filter(Boolean) as string[];
      }
      const palette = rawColors.map(c => parseColorToRgb(c, [1.0, 0.6, 0.1]));
      // Smooth gradient transition cycle (1.2 seconds per color)
      return getGradientColor(palette, timeSec, 1.2);
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      const currX = clientX / canvas.width;
      const currY = 1.0 - clientY / canvas.height;

      if (prevPointerX < 0) {
        prevPointerX = currX;
        prevPointerY = currY;
        return;
      }

      const dx = (currX - prevPointerX) * 28.0;
      const dy = (currY - prevPointerY) * 28.0;
      const aspect = canvas.width / canvas.height;
      const dist = Math.hypot((currX - prevPointerX) * aspect, currY - prevPointerY);

      // Interpolate along movement vector so continuous fluid strokes form smooth ribbons
      const steps = Math.max(1, Math.min(8, Math.ceil(dist / 0.035)));
      const elapsedSec = (performance.now() - simStartTime) / 1000;
      const color = getCurrentGradientColor(elapsedSec);

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = prevPointerX + (currX - prevPointerX) * t;
        const py = prevPointerY + (currY - prevPointerY) * t;
        executeSplat(px, py, dx, dy, color, 1.0);
      }

      prevPointerX = currX;
      prevPointerY = currY;
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        handlePointerMove(t.clientX, t.clientY);
      }
    };

    const onWindowTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        prevPointerX = t.clientX / canvas.width;
        prevPointerY = 1.0 - t.clientY / canvas.height;
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: true });
    window.addEventListener('touchstart', onWindowTouchStart, { passive: true });

    let lastFrameTime = performance.now();

    const render = (time: number) => {
      // Bound dt to prevent leapfrog instability
      const dt = Math.min((time - lastFrameTime) / 1000, 0.024) * powerRef.current * (configRef.current.speed / 40);
      lastFrameTime = time;

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);

      const curlVal = (configRef.current.curl / 40) * 34.0;
      const dissipationFactor = (configRef.current.dissipation / 40);
      // Exponential age fade: fluid gently dissipates as it ages
      const dyeDissipation = Math.max(0.92, Math.min(0.995, 1.0 - dissipationFactor * 0.016));
      const velDissipation = Math.max(0.94, Math.min(0.995, 1.0 - dissipationFactor * 0.008));

      // 1. Curl pass
      gl.useProgram(curlProg);
      gl.uniform2f(gl.getUniformLocation(curlProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(curlProg, 'uVelocity'), velocity.read.attach(0));
      blit(curl.fbo, curl.width, curl.height);

      // 2. Vorticity Confinement pass (produces curling swirls and fluid billows)
      gl.useProgram(vorticityProg);
      gl.uniform2f(gl.getUniformLocation(vorticityProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(vorticityProg, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(vorticityProg, 'uCurl'), curl.attach(1));
      gl.uniform1f(gl.getUniformLocation(vorticityProg, 'curl'), curlVal);
      gl.uniform1f(gl.getUniformLocation(vorticityProg, 'dt'), dt);
      blit(velocity.write.fbo, velocity.width, velocity.height);
      velocity.swap();

      // 3. Divergence pass
      gl.useProgram(divergenceProg);
      gl.uniform2f(gl.getUniformLocation(divergenceProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(divergenceProg, 'uVelocity'), velocity.read.attach(0));
      blit(divergence.fbo, divergence.width, divergence.height);

      // 4. Pressure Solve (28 Jacobi iterations for fluid incompressibility and self-collision displacement)
      gl.useProgram(pressureProg);
      gl.uniform2f(gl.getUniformLocation(pressureProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(pressureProg, 'uDivergence'), divergence.attach(0));
      for (let i = 0; i < 28; i++) {
        gl.uniform1i(gl.getUniformLocation(pressureProg, 'uPressure'), pressure.read.attach(1));
        blit(pressure.write.fbo, pressure.width, pressure.height);
        pressure.swap();
      }

      // 5. Gradient Subtract (projects velocity so swiping pushes and diverts existing fluid)
      gl.useProgram(gradSubProg);
      gl.uniform2f(gl.getUniformLocation(gradSubProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(gradSubProg, 'uPressure'), pressure.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(gradSubProg, 'uVelocity'), velocity.read.attach(1));
      blit(velocity.write.fbo, velocity.width, velocity.height);
      velocity.swap();

      // 6. Advect Velocity (advects momentum so moving water/smoke collides and rolls into waves)
      gl.useProgram(advectionProg);
      gl.uniform2f(gl.getUniformLocation(advectionProg, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(advectionProg, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(advectionProg, 'uSource'), velocity.read.attach(0));
      gl.uniform1f(gl.getUniformLocation(advectionProg, 'dt'), dt);
      gl.uniform1f(gl.getUniformLocation(advectionProg, 'dissipation'), velDissipation);
      blit(velocity.write.fbo, velocity.width, velocity.height);
      velocity.swap();

      // 7. Advect Dye (advects color density so moving streams push existing dye out of the way)
      gl.uniform2f(gl.getUniformLocation(advectionProg, 'texelSize'), density.texelSizeX, density.texelSizeY);
      gl.uniform1i(gl.getUniformLocation(advectionProg, 'uVelocity'), velocity.read.attach(0));
      gl.uniform1i(gl.getUniformLocation(advectionProg, 'uSource'), density.read.attach(1));
      gl.uniform1f(gl.getUniformLocation(advectionProg, 'dissipation'), dyeDissipation);
      blit(density.write.fbo, density.width, density.height);
      density.swap();

      // 8. Render to Screen
      gl.useProgram(displayProg);
      gl.uniform1i(gl.getUniformLocation(displayProg, 'uTexture'), density.read.attach(0));
      blit(null, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchstart', onWindowTouchStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-50 pointer-events-auto bg-black"
    />
  );
}
