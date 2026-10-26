export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function cardTilt(clientX, clientY, bounds, maximum = 3) {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0, lightX: 50, lightY: 50 };
  const nx = clamp((clientX - bounds.left) / bounds.width, 0, 1);
  const ny = clamp((clientY - bounds.top) / bounds.height, 0, 1);
  return { x: (0.5 - ny) * maximum * 2, y: (nx - 0.5) * maximum * 2, lightX: nx * 100, lightY: ny * 100 };
}

export function canAnimateScene({ visible, pageVisible, motionPaused, contextLost }) {
  return Boolean(visible && pageVisible && !motionPaused && !contextLost);
}

export function scenePixelRatio(deviceRatio, coarse) {
  return clamp(Number.isFinite(deviceRatio) ? deviceRatio : 1, 1, coarse ? 1 : 1.5);
}

export function mayDragScene(dx, dy, pointerType) {
  return pointerType !== 'touch' || Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.25;
}

export function pinPosition(projected, width, height, marginX = 23, marginY = 25) {
  return { x: clamp((projected.x + 1) / 2 * width, marginX, Math.max(marginX, width - marginX)), y: clamp((1 - projected.y) / 2 * height, marginY, Math.max(marginY, height - marginY)) };
}
