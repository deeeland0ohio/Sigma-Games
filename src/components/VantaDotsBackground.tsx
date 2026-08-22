import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VantaDotsBackgroundProps {
  color?: string;
  backgroundColor?: string;
  config?: {
    springSpeed: number;
    dotSize: number;
    splash: number;
  };
  power?: number;
}

function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.beginPath();
    context.arc(64, 64, 64, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

export function VantaDotsBackground({ color, backgroundColor, config, power = 1 }: VantaDotsBackgroundProps) {
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
    const bgColor = new THREE.Color(backgroundColor || '#09090b');
    scene.background = bgColor;
    // b64:QWRkIGZvZyB0byBoaWRlIHRoZSBkb3RzIHNuYXBwaW5nIGluIGF0IHRoZSBkaXN0YW5jZQ==
    scene.fog = new THREE.Fog(bgColor, 500, 2000);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    camera.position.set(0, 150, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // b64:Q2xlYXIgdXAgb2xkIGNhbnZhcyBpZiBhbnk=
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    const spacing = 50;
    const initialDotSizeVal = configRef.current?.dotSize ?? 4;
    const dotsColor = new THREE.Color(color || '#00ff00');
    
    const circleTexture = createCircleTexture();

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      color: dotsColor,
      size: initialDotSizeVal,
      map: circleTexture,
      transparent: true,
      opacity: 0.8,
      alphaTest: 0.5,
    });

    const positions: number[] = [];
    const basePositions: number[] = [];
    const gridScale = 50; 
    
    // b64:Q3JlYXRlIGFuIGV4cGFuc2l2ZSBncmlk
    for (let i = -gridScale; i <= gridScale; i++) {
        for (let j = -gridScale; j <= gridScale; j++) {
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

    // b64:QXJyYXkgdG8gc3RvcmUgYWN0aXZlIHNwbGFzaCByaXBwbGVz
    const splashes: { x: number, z: number, time: number, maxRadius: number }[] = [];
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentMouseX = 0;
    let currentMouseY = 0;
    
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    const handleMouseMove = (event: MouseEvent) => {
        currentMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        currentMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    const handleClick = (event: MouseEvent) => {
        if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, label, [role="button"], [role="switch"]')) {
            return;
        }
        // b64:Q2FsY3VsYXRlIHdoZXJlIHRoZSB1c2VyIGNsaWNrZWQgb24gdGhlICJmbG9vciIgcGxhbmU=
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        // b64:QXBwcm94aW1hdGUgZmxvb3IgaGVpZ2h0
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 140);
        const target = new THREE.Vector3();
        const intersectPoint = raycaster.ray.intersectPlane(plane, target);
        
        const currentConfig = configRef.current;
        const splashVal = currentConfig?.splash ?? 50;
        const splashMultiplier = Math.max(0.1, splashVal / 50);

        if (intersectPoint) {
            splashes.push({ x: target.x, z: target.z, time: 0, maxRadius: 400 * splashMultiplier });
        }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let frameId: number;
    let time = 0;
    
    // b64:Q29uc3RhbnQgWiBzcGVlZCBmb3IgZW5kbGVzcyBlZmZlY3Q=
    let scrollZ = 0;

    const animate = () => {
        // b64:ZHluYW1pY2FsbHkgZmV0Y2ggY29uZmlnIHZhcmlhYmxlcyBpbnNpZGUgdGhlIGxvb3A=
        const currentConfig = configRef.current;
        const springSpeed = currentConfig?.springSpeed ?? 50;
        const dotSizeVal = currentConfig?.dotSize ?? 4;
        const splashVal = currentConfig?.splash ?? 50;
        
        // b64:VXBkYXRlIHNpemUgZHluYW1pY2FsbHkgaW4gcHg=
        material.size = dotSizeVal;
        
        const speedMultiplier = Math.max(0.1, springSpeed / 50);
        const energyWaveSpeed = powerRef.current;
        const splashMultiplier = Math.max(0.1, splashVal / 50);

        // b64:U2xvdyBkb3duIHRoZSBmb3J3YXJkIG1vdmVtZW50IGFzIHJlcXVlc3RlZA==
        const baseScrollSpeed = 0.3; // b64:TXVjaCBzbG93ZXIgZm9yd2FyZCBtb3ZlbWVudA==
        const speed = baseScrollSpeed * speedMultiplier;

        // b64:V2F2ZSBhbmltYXRpb24gdXNlcyBnbG9iYWwgZW5lcmd5IG11bHRpcGxpZXI=
        time += 0.015 * energyWaveSpeed;
        scrollZ += speed;
        
        const posAttr = geometry.attributes.position;
        const positionsArr = posAttr.array as Float32Array;
        
        // b64:R2VudGxlIGNhbWVyYSBzd2F5IGJhc2VkIG9uIG1vdXNl
        const targetCamX = currentMouseX * 100;
        const targetCamY = 150 + (-currentMouseY * 50);
        
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.lookAt(camera.position.x * 0.5, 0, camera.position.z - 800); 
        
        // b64:VXBkYXRlIHNwbGFzaGVz
        for (let i = splashes.length - 1; i >= 0; i--) {
            // b64:U3BlZWQgb2YgcmlwcGxlIGlzIHNvbWV3aGF0IGRlcGVuZGVudCBvbiBzcGVlZE11bHRpcGxpZXI=
            splashes[i].time += 0.04 * Math.max(0.5, speedMultiplier);
            // b64:UmVtb3ZlIHNwbGFzaGVzIHRoYXQgaGF2ZSBleHBhbmRlZCBvdXQgY29tcGxldGVseQ==
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
            
            // b64:RmxvdyB0b3dhcmRzIGNhbWVyYQ==
            bz += scrollZ;
            
            // b64:V2hlbiBhIGxpbmUgb2YgZG90cyBwYXNzZXMgdGhlIGNhbWVyYSwgd3JhcCB0aGVtIGZhciBiYWNr
            const thresholdZ = camera.position.z + 100;
            while (bz > thresholdZ) {
                bz -= (gridScale * 2 * spacing);
                basePositions[idx+2] -= (gridScale * 2 * spacing); 
            }
            
            // b64:QW1iaWVudCB3YXZlIG1vdGlvbiBjb250cm9sbGVkIGJ5IGdsb2JhbEVuZXJneQ==
            let targetY = by + Math.sin(bz * 0.015 + bx * 0.01 + time) * 20 * energyWaveSpeed;
            
            // b64:Q2FsY3VsYXRlIHJpcHBsZSBkaXNwbGFjZW1lbnQ=
            for (const splash of splashes) {
                const dx = bx - splash.x;
                const dz = bz - splash.z;
                const dist = Math.sqrt(dx*dx + dz*dz);
                
                // b64:UmluZyBleHBhbmRzIGZyb20gY2xpY2sgY2VudGVy
                const waveRadius = splash.time * (250 * splashMultiplier);
                
                const distFromWave = dist - waveRadius;
                const splashWidth = 100 * splashMultiplier; // b64:V2lkZXIgdG8gcHJldmVudCBzcGF0aWFsIGFsaWFzaW5nIG9uIGdyaWQ=
                const splashHeight = 90 * splashMultiplier;

                // b64:T25seSBpbmZsdWVuY2UgZG90cyBuZWFyIHRoZSB3YXZlIHBhY2tldA==
                if (Math.abs(distFromWave) < splashWidth * 3 && dist < splash.maxRadius) {
                    // b64:Tm9ybWFsaXplZCBkaXN0YW5jZSBmcm9tIHdhdmUgY3Jlc3Q=
                    const x = (distFromWave / splashWidth) * 2;
                    
                    // b64:Umlja2VyIHdhdmVsZXQgKE1leGljYW4gaGF0KSBmb3JtdWxhIGZvciBhIGhpZ2hseSByZWFsaXN0aWMgbmF0dXJhbCByaXBwbGU=
                    // b64:SXQgcHJvdmlkZXMgYSBzbW9vdGggY3Jlc3QgYW5kIHN5bW1ldHJpY2FsIHRyb3VnaHM=
                    const wave = (1 - x * x) * Math.exp(-0.5 * x * x);
                    
                    // b64:RmFkZSBvdXQgYXMgaXQgZXhwYW5kcw==
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
        frameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
        cancelAnimationFrame(frameId);
        
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        
        if (containerRef.current && containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }
    };
  }, [color, backgroundColor]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
