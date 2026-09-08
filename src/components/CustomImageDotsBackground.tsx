import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CustomImageDotsBackgroundProps {
  backgroundColor?: string;
  config?: {
    springSpeed: number;
    dotSize: number;
    splash: number;
    imageUrl: string;
    opacity?: number;
  };
  power?: number;
}

const DEFAULT_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="256" height="256"><g transform="translate(50, 50) scale(1.35)"><circle cx="0" cy="0" r="32" fill="#000000"/><circle cx="0" cy="0" r="32" fill="none" stroke="#ef4444" stroke-width="2"/><ellipse cx="0" cy="0" rx="32" ry="10" fill="none" stroke="#10b981" stroke-width="2"/><ellipse cx="0" cy="0" rx="10" ry="32" fill="none" stroke="#ef4444" stroke-width="2"/><ellipse cx="0" cy="0" rx="32" ry="10" fill="none" stroke="#10b981" stroke-width="2" transform="rotate(45)"/><ellipse cx="0" cy="0" rx="32" ry="10" fill="none" stroke="#ef4444" stroke-width="2" transform="rotate(-45)"/><ellipse cx="0" cy="0" rx="32" ry="10" fill="none" stroke="#10b981" stroke-width="2" transform="rotate(90)"/></g></svg>`;

function createTextureFromCanvas(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function rasterizeSvgToTexture(svgString: string, onReady?: (tex: THREE.Texture) => void): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const img = new Image();
  const texture = createTextureFromCanvas(canvas);

  img.onload = () => {
    if (ctx) {
      ctx.clearRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);
      texture.needsUpdate = true;
      if (onReady) onReady(texture);
    }
    URL.revokeObjectURL(blobUrl);
  };
  img.onerror = () => {
    URL.revokeObjectURL(blobUrl);
  };
  img.src = blobUrl;
  return texture;
}

// Helper to safely load images across CORS & different protocols
function tryFetchImageBlob(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        resolve(objectUrl);
      })
      .catch((err) => reject(err));
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

async function loadCustomTexture(url: string, onLoad: (texture: THREE.Texture) => void) {
  if (!url || !url.trim()) {
    rasterizeSvgToTexture(DEFAULT_FAVICON_SVG, onLoad);
    return;
  }

  const trimmedUrl = url.trim();

  // 1. Inline SVG XML
  if (trimmedUrl.startsWith('<svg') || trimmedUrl.startsWith('<?xml')) {
    rasterizeSvgToTexture(trimmedUrl, onLoad);
    return;
  }

  // 2. SVG Data URI
  if (trimmedUrl.startsWith('data:image/svg+xml')) {
    try {
      if (trimmedUrl.includes('base64,')) {
        const base64 = trimmedUrl.split('base64,')[1];
        const decoded = atob(base64);
        rasterizeSvgToTexture(decoded, onLoad);
        return;
      } else if (trimmedUrl.includes('utf8,')) {
        const svgText = decodeURIComponent(trimmedUrl.split('utf8,')[1]);
        rasterizeSvgToTexture(svgText, onLoad);
        return;
      }
    } catch {
      // fallback to standard image processing
    }
  }

  const makeTextureFromImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, size, size);
      const iw = img.naturalWidth || img.width || size;
      const ih = img.naturalHeight || img.height || size;
      const scale = Math.min(size / iw, size / ih);
      const dw = Math.max(1, iw * scale);
      const dh = Math.max(1, ih * scale);
      const dx = (size - dw) / 2;
      const dy = (size - dh) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dw, dh);
      const texture = createTextureFromCanvas(canvas);
      onLoad(texture);
    }
  };

  // 3. Local path, blob URL, or data URL
  if (trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('blob:') || trimmedUrl.startsWith('/')) {
    try {
      const img = await loadImageElement(trimmedUrl);
      makeTextureFromImage(img);
      return;
    } catch {
      rasterizeSvgToTexture(DEFAULT_FAVICON_SVG, onLoad);
      return;
    }
  }

  // 4. SVG external URL
  const isSvgUrl = trimmedUrl.endsWith('.svg') || trimmedUrl.includes('.svg?') || trimmedUrl.includes('favicon.svg');
  if (isSvgUrl) {
    try {
      const res = await fetch(trimmedUrl);
      if (res.ok) {
        let svgText = await res.text();
        if (!svgText.includes('width=') && !svgText.includes('width =')) {
          svgText = svgText.replace('<svg', '<svg width="256" height="256"');
        }
        rasterizeSvgToTexture(svgText, onLoad);
        return;
      }
    } catch {
      // Try proxy for SVG
    }

    try {
      const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`);
      if (proxyRes.ok) {
        let svgText = await proxyRes.text();
        if (!svgText.includes('width=') && !svgText.includes('width =')) {
          svgText = svgText.replace('<svg', '<svg width="256" height="256"');
        }
        rasterizeSvgToTexture(svgText, onLoad);
        return;
      }
    } catch {
      // Fall through to raster loader
    }
  }

  // 5. Standard / External image URLs - try direct fetch, then direct load, then proxies
  const candidateUrls = [
    trimmedUrl,
    `https://images.weserv.nl/?url=${encodeURIComponent(trimmedUrl)}&output=png`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(trimmedUrl)}`
  ];

  for (const candidate of candidateUrls) {
    try {
      // Try fetching as blob first to completely avoid canvas CORS issues
      const blobUrl = await tryFetchImageBlob(candidate);
      const img = await loadImageElement(blobUrl);
      makeTextureFromImage(img);
      URL.revokeObjectURL(blobUrl);
      return;
    } catch {
      try {
        const img = await loadImageElement(candidate);
        makeTextureFromImage(img);
        return;
      } catch {
        // Continue to next candidate
      }
    }
  }

  // Final fallback
  rasterizeSvgToTexture(DEFAULT_FAVICON_SVG, onLoad);
}

export function CustomImageDotsBackground({ 
  backgroundColor = '#09090b', 
  config, 
  power = 1 
}: CustomImageDotsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const powerRef = useRef(power);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    powerRef.current = power;
  }, [power]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(backgroundColor);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(bgColor, 450, 2000);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.position.set(0, 150, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    const spacing = 50;
    const initialDotSize = configRef.current?.dotSize ?? 40;
    const imageUrl = configRef.current?.imageUrl || 'https://sigma-games.dev/favicon.svg';

    const defaultInitialTexture = rasterizeSvgToTexture(DEFAULT_FAVICON_SVG);

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: initialDotSize,
      map: defaultInitialTexture,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: false,
      fog: true,
    });

    loadCustomTexture(imageUrl, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });

    const positions: number[] = [];
    const basePositions: number[] = [];
    const gridScale = 50;

    // Generate row-by-row along Z axis (from furthest -gridScale to closest +gridScale)
    // This maintains natural back-to-front rendering order so back dots never overlap front dots
    for (let j = -gridScale; j <= gridScale; j++) {
      for (let i = -gridScale; i <= gridScale; i++) {
        const x = i * spacing + spacing / 2;
        const y = (Math.random() * 10) - 150;
        const z = j * spacing + spacing / 2;

        positions.push(x, y, z);
        basePositions.push(x, y, z);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const dots = new THREE.Points(geometry, material);
    scene.add(dots);

    interface Splash {
      x: number;
      z: number;
      time: number;
      maxRadius: number;
    }

    const splashes: Splash[] = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      currentMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      currentMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select, label')) {
        return;
      }

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 140);
      const target = new THREE.Vector3();
      const intersectPoint = raycaster.ray.intersectPlane(plane, target);

      const splashConfig = configRef.current?.splash ?? 43;
      const splashMultiplier = Math.max(0.1, splashConfig / 50);

      if (intersectPoint) {
        splashes.push({
          x: target.x,
          z: target.z,
          time: 0,
          maxRadius: 400 * splashMultiplier
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let animationFrameId: number;
    let time = 0;
    let scrollZ = 0;
    let lastLoadedUrl = imageUrl;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentConfig = configRef.current;
      const currentPower = powerRef.current ?? 1;

      // Update texture if imageUrl changed dynamically
      const activeImageUrl = currentConfig?.imageUrl || 'https://sigma-games.dev/favicon.svg';
      if (activeImageUrl !== lastLoadedUrl) {
        lastLoadedUrl = activeImageUrl;
        loadCustomTexture(activeImageUrl, (tex) => {
          material.map = tex;
          material.needsUpdate = true;
        });
      }

      const dotSizeVal = currentConfig?.dotSize ?? 40;
      material.size = dotSizeVal;
      material.opacity = 1.0;

      const springSpeedVal = currentConfig?.springSpeed ?? 38;
      const splashVal = currentConfig?.splash ?? 43;

      const speedMultiplier = Math.max(0.1, springSpeedVal / 50);
      const energyWaveSpeed = Math.max(0.1, currentPower);
      const splashMultiplier = Math.max(0.1, splashVal / 50);

      const baseScrollSpeed = 0.3;
      const speed = baseScrollSpeed * speedMultiplier;

      time += 0.015 * energyWaveSpeed;
      scrollZ += speed;

      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const positionsArr = posAttr.array as Float32Array;

      // Parallax camera sway
      const targetCamX = currentMouseX * 100;
      const targetCamY = 150 + (-currentMouseY * 50);
      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.lookAt(camera.position.x * 0.5, 0, camera.position.z - 800);

      // Update splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        splashes[i].time += 0.04 * Math.max(0.5, speedMultiplier);
        if (splashes[i].time > Math.PI) {
          splashes.splice(i, 1);
        }
      }

      const numPoints = positionsArr.length / 3;
      for (let i = 0; i < numPoints; i++) {
        const idx = i * 3;
        const bx = basePositions[idx];
        const by = basePositions[idx + 1];
        let bz = basePositions[idx + 2];

        bz += scrollZ;

        const thresholdZ = camera.position.z + 100;
        while (bz > thresholdZ) {
          bz -= (gridScale * 2 * spacing);
          basePositions[idx + 2] -= (gridScale * 2 * spacing);
        }

        let targetY = by + Math.sin(bz * 0.015 + bx * 0.01 + time) * 20 * energyWaveSpeed;

        for (let s = 0; s < splashes.length; s++) {
          const splash = splashes[s];
          const dx = bx - splash.x;
          const dz = bz - splash.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          const waveRadius = splash.time * (250 * splashMultiplier);
          const distFromWave = dist - waveRadius;
          const splashWidth = 100 * splashMultiplier;
          const splashHeight = 90 * splashMultiplier;

          if (Math.abs(distFromWave) < splashWidth * 3 && dist < splash.maxRadius) {
            const x = (distFromWave / splashWidth) * 2;
            const wave = (1 - x * x) * Math.exp(-0.5 * x * x);
            const fade = Math.max(0, 1 - (splash.time / Math.PI));
            targetY += wave * splashHeight * fade;
          }
        }

        positionsArr[idx] = bx;
        positionsArr[idx + 1] = targetY;
        positionsArr[idx + 2] = bz;
      }

      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch {
          // ignore
        }
      }
    };
  }, [backgroundColor]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-50"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: backgroundColor,
      }}
    />
  );
}
export default CustomImageDotsBackground;
