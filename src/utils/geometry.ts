import * as THREE from 'three';
import { VisualTheme } from '../types';
import {
  createRealisticBlockMaterial,
  getMetallicInlayMaterial,
  getDarkGrooveMaterial,
  getAccentCapMaterial,
} from './materials';

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
 * Constructs an Architectural Block Group containing layered cuts, metallic inlays,
 * recessed shadow channels, and bevelled multi-material slabs.
 */
export function createArchitecturalBlockGroup(
  width: number,
  height: number,
  depth: number,
  levelIndex: number,
  theme: VisualTheme,
  primaryColor: string
): THREE.Group {
  const group = new THREE.Group();
  const archetype = levelIndex % 5;

  const baseMat = createRealisticBlockMaterial(primaryColor, levelIndex, theme);
  const metalInlayMat = getMetallicInlayMaterial(primaryColor, levelIndex, theme);
  const grooveMat = getDarkGrooveMaterial();
  const accentCapMat = getAccentCapMaterial(primaryColor, levelIndex, theme);

  if (archetype === 0) {
    // STYLE 0: TRI-LAYER ARCHITECTURAL SANDWICH
    // Bottom stone slab, Middle recessed metallic channel inlay, Top ceramic/slate slab
    const h1 = height * 0.38;
    const hMid = height * 0.20;
    const h2 = height * 0.38;

    // Bottom slab
    const bottomGeo = createBevelledBoxGeometry(width, h1, depth, 0.025);
    const bottomMesh = new THREE.Mesh(bottomGeo, baseMat);
    bottomMesh.position.y = -height / 2 + h1 / 2;
    bottomMesh.castShadow = true;
    bottomMesh.receiveShadow = true;
    group.add(bottomMesh);

    // Recessed dark groove lower
    const gLowerGeo = createBevelledBoxGeometry(Math.max(0.01, width - 0.01), 0.015, Math.max(0.01, depth - 0.01), 0.005);
    const gLowerMesh = new THREE.Mesh(gLowerGeo, grooveMat);
    gLowerMesh.position.y = -height / 2 + h1 + 0.0075;
    group.add(gLowerMesh);

    // Middle metallic inlay band (recessed for realistic 3D shadow channel)
    const midW = Math.max(0.02, width - 0.012);
    const midD = Math.max(0.02, depth - 0.012);
    const midGeo = createBevelledBoxGeometry(midW, hMid, midD, 0.015);
    const midMesh = new THREE.Mesh(midGeo, metalInlayMat);
    midMesh.position.y = 0;
    midMesh.castShadow = true;
    midMesh.receiveShadow = true;
    group.add(midMesh);

    // Recessed dark groove upper
    const gUpperGeo = createBevelledBoxGeometry(Math.max(0.01, width - 0.01), 0.015, Math.max(0.01, depth - 0.01), 0.005);
    const gUpperMesh = new THREE.Mesh(gUpperGeo, grooveMat);
    gUpperMesh.position.y = height / 2 - h2 - 0.0075;
    group.add(gUpperMesh);

    // Top slab
    const topGeo = createBevelledBoxGeometry(width, h2, depth, 0.025);
    const topMesh = new THREE.Mesh(topGeo, accentCapMat);
    topMesh.position.y = height / 2 - h2 / 2;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);

  } else if (archetype === 1) {
    // STYLE 1: DUAL PERIMETER ENGRAVED GROOVES & PRECISION SLAB
    const coreGeo = createBevelledBoxGeometry(width, height, depth, 0.035);
    const coreMesh = new THREE.Mesh(coreGeo, baseMat);
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    group.add(coreMesh);

    // Upper Engraved Channel Ring
    const ringW = Math.max(0.01, width + 0.001);
    const ringD = Math.max(0.01, depth + 0.001);
    const groove1Geo = createBevelledBoxGeometry(ringW, 0.035, ringD, 0.008);
    const groove1Mesh = new THREE.Mesh(groove1Geo, grooveMat);
    groove1Mesh.position.y = height * 0.22;
    group.add(groove1Mesh);

    // Upper Metallic Inlay Ribbon
    const inlay1Geo = createBevelledBoxGeometry(Math.max(0.01, width - 0.006), 0.02, Math.max(0.01, depth - 0.006), 0.005);
    const inlay1Mesh = new THREE.Mesh(inlay1Geo, metalInlayMat);
    inlay1Mesh.position.y = height * 0.22;
    inlay1Mesh.castShadow = true;
    group.add(inlay1Mesh);

    // Lower Engraved Channel Ring
    const groove2Mesh = new THREE.Mesh(groove1Geo, grooveMat);
    groove2Mesh.position.y = -height * 0.22;
    group.add(groove2Mesh);

    // Lower Metallic Inlay Ribbon
    const inlay2Mesh = new THREE.Mesh(inlay1Geo, metalInlayMat);
    inlay2Mesh.position.y = -height * 0.22;
    inlay2Mesh.castShadow = true;
    group.add(inlay2Mesh);

  } else if (archetype === 2) {
    // STYLE 2: END-CAP & METALLIC CORNER TRIM FRAME
    const hCap = height * 0.085;
    const hBody = height - hCap * 2;

    const bodyGeo = createBevelledBoxGeometry(width, hBody, depth, 0.03);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Top Metal Cap
    const topCapGeo = createBevelledBoxGeometry(width, hCap, depth, 0.015);
    const topCapMesh = new THREE.Mesh(topCapGeo, metalInlayMat);
    topCapMesh.position.y = height / 2 - hCap / 2;
    topCapMesh.castShadow = true;
    topCapMesh.receiveShadow = true;
    group.add(topCapMesh);

    // Bottom Metal Cap
    const botCapMesh = new THREE.Mesh(topCapGeo, metalInlayMat);
    botCapMesh.position.y = -height / 2 + hCap / 2;
    botCapMesh.castShadow = true;
    botCapMesh.receiveShadow = true;
    group.add(botCapMesh);

    // Center Vertical Accent Slot
    const slotW = Math.min(width * 0.25, 0.12);
    const slotD = Math.max(0.01, depth + 0.002);
    const slotGeo = createBevelledBoxGeometry(slotW, hBody * 0.7, slotD, 0.01);
    const slotMesh = new THREE.Mesh(slotGeo, accentCapMat);
    slotMesh.castShadow = true;
    group.add(slotMesh);

  } else if (archetype === 3) {
    // STYLE 3: QUAD-SLAB LOUVRE / RIBBED ARCHITECTURE
    const slabCount = 4;
    const stringerH = 0.018;
    const totalStringersH = stringerH * 3;
    const slabH = (height - totalStringersH) / slabCount;

    let currentY = -height / 2 + slabH / 2;

    for (let i = 0; i < slabCount; i++) {
      const slabGeo = createBevelledBoxGeometry(width, slabH, depth, 0.018);
      const slabMat = i % 2 === 0 ? baseMat : accentCapMat;
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = currentY;
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      group.add(slabMesh);

      currentY += slabH / 2;

      if (i < slabCount - 1) {
        currentY += stringerH / 2;
        const stringerGeo = createBevelledBoxGeometry(Math.max(0.01, width - 0.008), stringerH, Math.max(0.01, depth - 0.008), 0.005);
        const stringerMesh = new THREE.Mesh(stringerGeo, metalInlayMat);
        stringerMesh.position.y = currentY;
        stringerMesh.castShadow = true;
        group.add(stringerMesh);

        currentY += stringerH / 2 + slabH / 2;
      }
    }

  } else {
    // STYLE 4: CROWN MONOLITH (OBSIDIAN GLASS & GOLD INLAY PRISM)
    const coreGeo = createBevelledBoxGeometry(width, height, depth, 0.04);
    const coreMesh = new THREE.Mesh(coreGeo, baseMat);
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    group.add(coreMesh);

    // Recessed Crown Inlay Plate on Top Surface
    const inlayW = Math.max(0.02, width * 0.75);
    const inlayD = Math.max(0.02, depth * 0.75);
    const inlayH = 0.03;
    const inlayGeo = createBevelledBoxGeometry(inlayW, inlayH, inlayD, 0.01);
    const inlayMesh = new THREE.Mesh(inlayGeo, metalInlayMat);
    inlayMesh.position.y = height / 2 - inlayH / 2 + 0.002;
    inlayMesh.castShadow = true;
    group.add(inlayMesh);

    // Perimeter Rim Bevel Framing
    const rimGeo = createBevelledBoxGeometry(width + 0.002, 0.03, depth + 0.002, 0.008);
    const rimMesh = new THREE.Mesh(rimGeo, accentCapMat);
    rimMesh.position.y = 0;
    group.add(rimMesh);
  }

  return group;
}

/**
 * Updates materials across all child meshes of an architectural block group when theme changes.
 */
export function updateArchitecturalBlockGroupMaterials(
  group: THREE.Group,
  color: string,
  levelIndex: number,
  theme: VisualTheme
): void {
  const baseMat = createRealisticBlockMaterial(color, levelIndex, theme);
  const metalInlayMat = getMetallicInlayMaterial(color, levelIndex, theme);
  const grooveMat = getDarkGrooveMaterial();
  const accentCapMat = getAccentCapMaterial(color, levelIndex, theme);

  group.children.forEach((child, idx) => {
    if (child instanceof THREE.Mesh) {
      if (child.material === grooveMat) {
        child.material = grooveMat;
      } else if (idx % 2 === 1) {
        child.material = metalInlayMat;
      } else if (idx > 2) {
        child.material = accentCapMat;
      } else {
        child.material = baseMat;
      }
    }
  });
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
