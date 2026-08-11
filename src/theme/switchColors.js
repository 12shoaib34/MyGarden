const darkSwitchTrackOff = "#121A14";

function hexToRgba(hex, alpha) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    return hex;
  }

  const value = match[1];
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getSwitchColors(theme, checked) {
  const isDark = theme.mode === "dark";

  return {
    trackColor: {
      false: isDark ? darkSwitchTrackOff : theme.colors.surfaceHigh,
      true: isDark ? hexToRgba(theme.colors.primary, 0.45) : theme.colors.secondaryContainer,
    },
    thumbColor: checked
      ? theme.colors.primary
      : isDark
      ? theme.colors.textMuted
      : theme.colors.surface,
    iosBackgroundColor: isDark ? darkSwitchTrackOff : theme.colors.surfaceHigh,
  };
}
