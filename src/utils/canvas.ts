export function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.arcTo(x + width, y + height, x + width - cornerRadius, y + height, cornerRadius);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
  ctx.closePath();
  ctx.clip();
  
  // Use createImageBitmap for better performance when available
  if (typeof createImageBitmap !== 'undefined' && image.complete) {
    createImageBitmap(image)
      .then(bitmap => {
        ctx.drawImage(bitmap, x, y, width, height);
      })
      .catch(() => {
        // Fallback to regular drawImage if createImageBitmap fails
        ctx.drawImage(image, x, y, width, height);
      });
  } else {
    ctx.drawImage(image, x, y, width, height);
  }
  
  ctx.restore();
}

export function createGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: { offset: number; color: string; }[]
) {
  // Cache gradients for better performance
  const cacheKey = `${x}-${y}-${width}-${height}-${colors.map(c => `${c.offset}-${c.color}`).join('-')}`;
  const cachedGradient = (ctx as any).__gradientCache?.[cacheKey];
  
  if (cachedGradient) {
    return cachedGradient;
  }
  
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  colors.forEach(({ offset, color }) => {
    gradient.addColorStop(offset, color);
  });
  
  // Initialize cache if it doesn't exist
  if (!(ctx as any).__gradientCache) {
    (ctx as any).__gradientCache = {};
  }
  
  // Cache the gradient
  (ctx as any).__gradientCache[cacheKey] = gradient;
  
  return gradient;
}