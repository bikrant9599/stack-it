import * as THREE from 'three';
import { VisualTheme } from '../types';

/**
 * Utility to procedurally generate photorealistic material texture maps using HTML5 Canvas.
 * Generates Diffuse, Bump, and Roughness maps without needing external image assets.
 */

// Cached textures to avoid re-generating on every frame
const textureCache = new Map<string, THREE.CanvasTexture>();

function createNoiseCanvas(width: number, height: number, noiseFactor: number = 0.1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imgData = ctx.createImageData(width, height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const val = Math.floor(255 * (1 - noiseFactor + Math.random() * noiseFactor));
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Generates a procedural Wood Texture (Grain + Bump + Roughness)
 */
export function getWoodTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'wood_tex';
  if (textureCache.has(key + '_map')) {
    return {
      map: textureCache.get(key + '_map')!,
      bumpMap: textureCache.get(key + '_bump')!,
      roughnessMap: textureCache.get(key + '_rough')!,
    };
  }

  const width = 512;
  const height = 512;

  // 1. Diffuse / Color Map
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = width;
  mapCanvas.height = height;
  const ctx = mapCanvas.getContext('2d')!;

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, width, height);

  // Draw fine wood rings and grain
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 120; i++) {
    const y = Math.random() * height;
    ctx.strokeStyle = `rgba(120, 53, 15, ${0.1 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.33, y + (Math.random() - 0.5) * 15, width * 0.66, y + (Math.random() - 0.5) * 15, width, y);
    ctx.stroke();
  }

  // 2. Bump Map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < 200; i++) {
    const y = Math.random() * height;
    bCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(width, y);
    bCtx.stroke();
  }

  // 3. Roughness Map
  const roughCanvas = createNoiseCanvas(width, height, 0.15);

  const map = new THREE.CanvasTexture(mapCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  textureCache.set(key + '_map', map);
  textureCache.set(key + '_bump', bumpMap);
  textureCache.set(key + '_rough', roughnessMap);

  return { map, bumpMap, roughnessMap };
}

/**
 * Generates a procedural Concrete / Stone Texture
 */
export function getConcreteTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'concrete_tex';
  if (textureCache.has(key + '_map')) {
    return {
      map: textureCache.get(key + '_map')!,
      bumpMap: textureCache.get(key + '_bump')!,
      roughnessMap: textureCache.get(key + '_rough')!,
    };
  }

  const width = 512;
  const height = 512;

  // Map Canvas
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = width;
  mapCanvas.height = height;
  const ctx = mapCanvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, width, height);

  // Micro pitting
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bump Canvas
  const bumpCanvas = createNoiseCanvas(width, height, 0.25);
  const roughCanvas = createNoiseCanvas(width, height, 0.35);

  const map = new THREE.CanvasTexture(mapCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  textureCache.set(key + '_map', map);
  textureCache.set(key + '_bump', bumpMap);
  textureCache.set(key + '_rough', roughnessMap);

  return { map, bumpMap, roughnessMap };
}

/**
 * Generates a procedural Brushed Metal Texture
 */
export function getBrushedMetalTexture(): { bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const key = 'metal_tex';
  if (textureCache.has(key + '_bump')) {
    return {
      bumpMap: textureCache.get(key + '_bump')!,
      roughnessMap: textureCache.get(key + '_rough')!,
    };
  }

  const width = 512;
  const height = 512;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const ctx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, width, height);

  // Brushed hairline scratches
  for (let i = 0; i < 800; i++) {
    const y = Math.random() * height;
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const roughCanvas = createNoiseCanvas(width, height, 0.1);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  textureCache.set(key + '_bump', bumpMap);
  textureCache.set(key + '_rough', roughnessMap);

  return { bumpMap, roughnessMap };
}

/**
 * Material Factory for Block Meshes based on Architectural Archetypes and Height Progression
 */
export function createRealisticBlockMaterial(
  color: string,
  index: number,
  theme: VisualTheme
): THREE.MeshStandardMaterial {
  // Height progression tier
  const isEarly = index <= 5;
  const isMiddle = index > 5 && index <= 15;
  const isHigh = index > 15;

  // Material archetype pattern based on block index
  const archetype = index % 5;

  if (theme === 'MONOCHROME') {
    if (index % 4 === 0) {
      // Polished Brass / Gold Accent
      const { bumpMap, roughnessMap } = getBrushedMetalTexture();
      return new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        metalness: 0.88,
        roughness: 0.16,
        bumpMap,
        bumpScale: 0.003,
        roughnessMap,
      });
    } else {
      // Dark Slate Architectural Concrete
      const { bumpMap, roughnessMap } = getConcreteTexture();
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.65,
        bumpMap,
        bumpScale: 0.006,
        roughnessMap,
      });
    }
  }

  if (theme === 'NEON') {
    const { bumpMap, roughnessMap } = getBrushedMetalTexture();
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.75,
      roughness: 0.2,
      bumpMap,
      bumpScale: 0.004,
      roughnessMap,
      emissive: color,
      emissiveIntensity: 0.08,
    });
  }

  // DEFAULT / PASTEL / SUNSET ARCHITECTURAL PALETTE PROGRESSION

  if (isHigh && archetype === 0) {
    // Tier 3: Polished Gold / Brass Crown
    const { bumpMap, roughnessMap } = getBrushedMetalTexture();
    return new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      metalness: 0.9,
      roughness: 0.15,
      bumpMap,
      bumpScale: 0.002,
      roughnessMap,
    });
  }

  if (isHigh && archetype === 1) {
    // Tier 3: Deep Obsidian Slate
    const { bumpMap, roughnessMap } = getConcreteTexture();
    return new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.35,
      roughness: 0.25,
      bumpMap,
      bumpScale: 0.005,
      roughnessMap,
    });
  }

  if ((isMiddle || isHigh) && archetype === 2) {
    // Tier 2: Brushed Titanium / Anodized Alloy
    const { bumpMap, roughnessMap } = getBrushedMetalTexture();
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.7,
      roughness: 0.22,
      bumpMap,
      bumpScale: 0.004,
      roughnessMap,
    });
  }

  if ((isMiddle || isHigh) && archetype === 3) {
    // Tier 2: Scandinavian Satin Wood
    const { bumpMap, roughnessMap } = getWoodTexture();
    return new THREE.MeshStandardMaterial({
      color,
      metalness: 0.08,
      roughness: 0.35,
      bumpMap,
      bumpScale: 0.005,
      roughnessMap,
    });
  }

  // Tier 1 & Default: Honed Architectural Stone & Fine Terrazzo Concrete
  const { bumpMap, roughnessMap } = getConcreteTexture();
  return new THREE.MeshStandardMaterial({
    color,
    metalness: isEarly ? 0.05 : 0.2,
    roughness: isEarly ? 0.55 : 0.38,
    bumpMap,
    bumpScale: 0.006,
    roughnessMap,
  });
}
