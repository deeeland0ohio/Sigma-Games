import React from 'react';
import { useTheme, useThemeColors } from '../context/ThemeContext';
import DotBackground from './DotBackground';
import MatrixBackground from './MatrixBackground';
import BlackHoleBackground from './BlackHoleBackground';
import LightspeedBackground from './LightspeedBackground';

export default function BackgroundManager() {
  const { background, simulationPower, backgroundConfig } = useTheme();
  const colors = useThemeColors();

  // Scale 1-100 to 0.02-2.0 multiplier
  const powerMultiplier = simulationPower / 50;

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
