import React from 'react';
import { useTheme, useThemeColors } from '../context/ThemeContext';
import DotBackground from './DotBackground';
import MatrixBackground from './MatrixBackground';
import BlackHoleBackground from './BlackHoleBackground';

export default function BackgroundManager() {
  const { background, simulationPower } = useTheme();
  const colors = useThemeColors();

  // Scale 1-100 to 0.02-2.0 multiplier
  const powerMultiplier = simulationPower / 50;

  if (background === 'matrix') {
    return <MatrixBackground color={colors.hexMatrix} power={powerMultiplier} />;
  }
  
  if (background === 'black-hole') {
    return <BlackHoleBackground color1={colors.hexPrimary} color2={colors.hexSecondary} power={powerMultiplier} />;
  }

  return <DotBackground color1={colors.hexPrimary} color2={colors.hexSecondary} power={powerMultiplier} />;
}
