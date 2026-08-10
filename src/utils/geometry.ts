import * as THREE from 'three';

/**
 * Creates a realistic bevelled box geometry using ExtrudeGeometry.
 * This gives smooth rounded edges that catch specular light beautifully.
 */
export function createBevelledBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number = 0.04
): THREE.BufferGeometry {
  // Ensure bevel radius isn't larger than half the smallest dimension
  const maxRadius = Math.min(width, depth, height) * 0.2;
  const bevelRadius = Math.min(radius, maxRadius);

  if (bevelRadius <= 0.001) {
    return new THREE.BoxGeometry(width, height, depth);
  }

  const shape = new THREE.Shape();
  const w = width / 2;
  const d = depth / 2;
  const r = bevelRadius;

  // Draw rounded 2D rectangle in X-Z plane (using X-Y for shape)
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: r,
    bevelThickness: r,
    bevelOffset: -r,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Center geometry vertically and rotate so extrusion is vertical (along Y axis)
  geometry.center();
  geometry.rotateX(Math.PI / 2);

  // Compute vertex normals for accurate lighting
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Color palettes and studio environment configurations.
 */
export const THEMES = {
  PASTEL: {
    name: 'Nordic Wood & Porcelain',
    bgGradient: ['#1e293b', '#0f172a'] as [string, string],
    fogColor: '#0f172a',
    ambientLight: '#f1f5f9',
    dirLight: '#fef08a',
    rimLight: '#60a5fa',
    basePedestal: '#334155',
    getPaletteColor: (index: number) => {
      // Natural Scandinavian earthy pastel tones
      const hues = [35, 160, 200, 280, 15, 340, 220, 180];
      const hue = hues[index % hues.length];
      const lightness = 62 + (index % 3) * 4;
      return `hsl(${hue}, 45%, ${lightness}%)`;
    },
  },
  NEON: {
    name: 'Obsidian & Anodized Alloys',
    bgGradient: ['#111827', '#030712'] as [string, string],
    fogColor: '#030712',
    ambientLight: '#e0e7ff',
    dirLight: '#38bdf8',
    rimLight: '#a855f7',
    basePedestal: '#1f2937',
    getPaletteColor: (index: number) => {
      const hue = (index * 36 + 210) % 360;
      return `hsl(${hue}, 70%, 55%)`;
    },
  },
  MONOCHROME: {
    name: 'Architectural Slate & Gold',
    bgGradient: ['#262626', '#0f0f0f'] as [string, string],
    fogColor: '#0f0f0f',
    ambientLight: '#ffffff',
    dirLight: '#fef08a',
    rimLight: '#fbbf24',
    basePedestal: '#333333',
    getPaletteColor: (index: number) => {
      if (index % 5 === 0) return '#d97706'; // Polished gold accent every 5 blocks
      const lightness = 35 + (index % 5) * 10;
      return `hsl(210, 8%, ${lightness}%)`;
    },
  },
  SUNSET: {
    name: 'Terracotta & Satin Brass',
    bgGradient: ['#2e1065', '#0f172a'] as [string, string],
    fogColor: '#0f172a',
    ambientLight: '#ffedd5',
    dirLight: '#fb7185',
    rimLight: '#f43f5e',
    basePedestal: '#3b0764',
    getPaletteColor: (index: number) => {
      const hues = [15, 30, 340, 355, 25, 45];
      const hue = hues[index % hues.length];
      return `hsl(${hue}, 65%, 58%)`;
    },
  },
};
