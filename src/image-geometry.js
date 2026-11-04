export function imageSize(width, height, turns = 0) {
  return Math.abs(turns % 2) ? { width: height, height: width } : { width, height };
}
export function clampCrop(crop, width, height) {
  const x = Math.max(0, Math.min(width - 1, Math.round(Number(crop.x) || 0)));
  const y = Math.max(0, Math.min(height - 1, Math.round(Number(crop.y) || 0)));
  return { x, y, width: Math.max(1, Math.min(width - x, Math.round(Number(crop.width) || 1))), height: Math.max(1, Math.min(height - y, Math.round(Number(crop.height) || 1))) };
}
export function centeredCrop(width, height, ratio = 0) {
  if (!ratio) return { x: 0, y: 0, width, height };
  const w = Math.min(width, height * ratio), h = w / ratio;
  return clampCrop({ x: (width - w) / 2, y: (height - h) / 2, width: w, height: h }, width, height);
}
export function outputSize(crop, requested, axis = 'width') {
  const limit = Math.max(1, Math.round(Number(requested) || crop[axis]));
  const scale = Math.min(1, limit / crop[axis], 1920 / Math.max(crop.width, crop.height));
  return { width: Math.max(1, Math.round(crop.width * scale)), height: Math.max(1, Math.round(crop.height * scale)) };
}
