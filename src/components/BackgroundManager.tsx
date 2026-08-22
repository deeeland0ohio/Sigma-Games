import React, { useState, useEffect } from 'react';
import { useTheme, useThemeColors } from '../context/ThemeContext';
import DotBackground from './DotBackground';
import MatrixBackground from './MatrixBackground';
import BlackHoleBackground from './BlackHoleBackground';
import LightspeedBackground from './LightspeedBackground';
import { VantaDotsBackground } from './VantaDotsBackground';

export default function BackgroundManager() {
  const { background, simulationPower, backgroundConfig } = useTheme();
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

    // b64:Q2hlY2sgcGVyaW9kaWNhbGx5IGZvciBmdWxsc2NyZWVuIGlmcmFtZSBvdmVybGF5cw==
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

  // b64:U2NhbGUgMS0xMDAgdG8gMC4wMi0yLjAgbXVsdGlwbGllcg==
  const powerMultiplier = simulationPower / 50;

  if (background === 'vanta-dots') {
    return <VantaDotsBackground color={colors.hexMatrix} backgroundColor="#09090b" config={backgroundConfig.vantaDots} power={powerMultiplier} />;
  }

  if (background === 'matrix') {
    return <MatrixBackground color={colors.hexMatrix} power={powerMultiplier} config={backgroundConfig.matrix} />;
  }
  
  if (background === 'black-hole') {
    return <BlackHoleBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} power={powerMultiplier} config={backgroundConfig.blackHole} />;
  }

  if (background === 'lightspeed') {
    return <LightspeedBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} power={powerMultiplier} config={backgroundConfig.lightspeed} />;
  }

  return <DotBackground color1={colors.hexPrimary} color2={colors.hexSecondary} color3={colors.hexTertiary} color4={colors.hexQuaternary} power={powerMultiplier} config={backgroundConfig.dots} />;
}
