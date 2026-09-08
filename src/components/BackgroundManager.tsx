import React, { useState, useEffect } from 'react';
import { useTheme, useThemeColors } from '../context/ThemeContext';
import DotBackground from './DotBackground';
import MatrixBackground from './MatrixBackground';
import BlackHoleBackground from './BlackHoleBackground';
import LightspeedBackground from './LightspeedBackground';
import FluidBackground from './FluidBackground';
import { VantaDotsBackground } from './VantaDotsBackground';
import { CustomImageDotsBackground } from './CustomImageDotsBackground';
import { CustomImageBackground } from './CustomImageBackground';

export default function BackgroundManager() {
  const { background, theme, simulationPower, backgroundConfig } = useTheme();
  const colors = useThemeColors();
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    const checkGameActive = () => {
      const hasGamePath = window.location.hash.includes('#/play/') || 
                           window.location.hash.includes('#/external-player');
      
      const hasGameIframe = !!(
        document.getElementById('game-iframe') ||
        document.getElementById('ugs-iframe') ||
        document.getElementById('seraph-iframe') ||
        document.getElementById('threekh0-iframe') ||
        document.getElementById('noah-iframe') ||
        document.getElementById('alexr-game-iframe') ||
        document.getElementById('external-iframe')
      );

      setIsGameActive(hasGamePath || hasGameIframe);
    };

    checkGameActive();

    // Check periodically for fullscreen iframe overlays
    const interval = setInterval(checkGameActive, 250);

    window.addEventListener('hashchange', checkGameActive);
    window.addEventListener('popstate', checkGameActive);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', checkGameActive);
      window.removeEventListener('popstate', checkGameActive);
    };
  }, []);

  if (isGameActive || background === 'blank') {
    return <div className="fixed inset-0 bg-black -z-50" />;
  }

  // Scale 1-100 to 0.02-2.0 multiplier
  const powerMultiplier = simulationPower / 50;
  // Multi-color palette for backgrounds with multiple color elements
  const multiColorPalette = colors.palette || [colors.hexPrimary, colors.hexSecondary, colors.hexTertiary, colors.hexQuaternary].filter(Boolean);
  
  // Matrix Flow and 3D Dots are single-color backgrounds unless on the Rainbow theme
  const singleOrRainbowPalette = theme === 'rainbow' ? colors.palette : undefined;

  if (background === 'vanta-dots') {
    return <VantaDotsBackground color={colors.hexMatrix} palette={singleOrRainbowPalette} backgroundColor="#09090b" config={backgroundConfig.vantaDots} power={powerMultiplier} />;
  }

  if (background === 'custom-image-dots') {
    return <CustomImageDotsBackground backgroundColor="#09090b" config={backgroundConfig.customImageDots} power={powerMultiplier} />;
  }

  if (background === 'custom-image-bg') {
    return <CustomImageBackground config={backgroundConfig.customImageBg} />;
  }

  if (background === 'matrix') {
    return <MatrixBackground color={colors.hexMatrix} palette={singleOrRainbowPalette} power={powerMultiplier} config={backgroundConfig.matrix} />;
  }
  
  if (background === 'black-hole') {
    return <BlackHoleBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} palette={multiColorPalette} power={powerMultiplier} config={backgroundConfig.blackHole} />;
  }

  if (background === 'lightspeed') {
    return <LightspeedBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} palette={multiColorPalette} power={powerMultiplier} config={backgroundConfig.lightspeed} />;
  }

  if (background === 'fluid') {
    return <FluidBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} palette={multiColorPalette} power={powerMultiplier} config={backgroundConfig.fluid} />;
  }

  return <DotBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} palette={multiColorPalette} power={powerMultiplier} config={backgroundConfig.dots} />;
}
