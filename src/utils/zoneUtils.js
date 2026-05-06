import { APPLE_ZONE } from "./constants";

// Apple zone logic: returns true if (x, y) is in the Apple
export function isInApple(x, y) {
  return (
    x >= APPLE_ZONE.xMin &&
    x <= APPLE_ZONE.xMax &&
    y >= APPLE_ZONE.yMin &&
    y <= APPLE_ZONE.yMax
  );
}

export function roundToOneDecimal(value) {
  const num = parseFloat(value);
  return isNaN(num) ? value : num.toFixed(1);
}
