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
export function outputSize(crop, requestedWidth = crop.width) {
  const width = Math.max(1, Math.min(crop.width, 1920, Math.round(Number(requestedWidth) || crop.width)));
  const scale = Math.min(1, 1920 / Math.max(width, width * crop.height / crop.width));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(width * crop.height / crop.width * scale)) };
}
