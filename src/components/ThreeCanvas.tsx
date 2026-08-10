import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  GameState, 
  DifficultyMode, 
  VisualTheme, 
  BlockDimensions, 
  Vector3D, 
  PlacedBlock, 
  FallingDebris,
  GameStats
} from '../types';
import { createBevelledBoxGeometry, THEMES } from '../utils/geometry';
import { createRealisticBlockMaterial, getConcreteTexture } from '../utils/materials';
import { soundEngine, MaterialType } from '../utils/audio';

interface ThreeCanvasProps {
  gameState: GameState;
  difficulty: DifficultyMode;
  theme: VisualTheme;
  onBlockPlaced: (comboCount: number, isPerfect: boolean) => void;
  onGameOver: (stats: GameStats) => void;
  onUpdateStats: (score: number, heightMeters: number) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  gameState,
  difficulty,
  theme,
  onBlockPlaced,
  onGameOver,
  onUpdateStats,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);
  const pedestalMeshRef = useRef<THREE.Mesh | null>(null);

  // Game Logic State Refs
  const placedBlocksRef = useRef<PlacedBlock[]>([]);
  const blockMeshesRef = useRef<THREE.Mesh[]>([]);
  const blockSquashDataRef = useRef<Map<THREE.Mesh, { scaleY: number; scaleXZ: number; velY: number; velXZ: number }>>(new Map());
  const debrisListRef = useRef<{ mesh: THREE.Mesh; data: FallingDebris }[]>([]);
  
  // Dust & Crumb Particles System Ref
  const dustParticlesRef = useRef<{ 
    mesh: THREE.InstancedMesh; 
    data: { pos: THREE.Vector3; vel: THREE.Vector3; scale: number; alpha: number; maxLife: number; life: number }[] 
  } | null>(null);

  // Floating Studio Dust Motes
  const ambientMotesRef = useRef<THREE.Points | null>(null);

  // Active Moving Block Ref
  const activeMovingMeshRef = useRef<THREE.Mesh | null>(null);
  const movingAxisRef = useRef<'x' | 'z'>('x');
  const movePhaseRef = useRef<number>(0); // 0 to 2PI for smooth sinusoidal motion

  // Game Attributes
  const scoreRef = useRef<number>(0);
  const comboCountRef = useRef<number>(0);
  const perfectCountRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const totalDropsRef = useRef<number>(0);
  
  // Hit-stop / Micro Slow-Motion Time Scale
  const timeScaleRef = useRef<number>(1.0);

  // Physics Settle & Wobble Dynamics
  const towerCompressionRef = useRef<number>(0);
  const compressionVelRef = useRef<number>(0);
  const cameraTargetYRef = useRef<number>(1.2);
  const currentCameraYRef = useRef<number>(1.2);
  const screenShakeRef = useRef<number>(0);
  const towerWobbleAngleXRef = useRef<number>(0);
  const towerWobbleAngleZRef = useRef<number>(0);
  const wobbleVelocityXRef = useRef<number>(0);
  const wobbleVelocityZRef = useRef<number>(0);

  // Audio Cooldowns
  const lastCreakTimeRef = useRef<number>(0);

  // Animation Frame Ref
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Configuration parameters based on difficulty
  const getConfig = () => {
    switch (difficulty) {
      case 'HARDCORE':
        return { baseSpeed: 2.8, moveRange: 3.2, perfectThreshold: 0.05, initialSize: 2.0, wobbleFactor: 0.04 };
      case 'PHYSICS':
        return { baseSpeed: 2.2, moveRange: 3.5, perfectThreshold: 0.08, initialSize: 2.2, wobbleFactor: 0.06 };
      case 'CASUAL':
      default:
        return { baseSpeed: 1.7, moveRange: 3.5, perfectThreshold: 0.10, initialSize: 2.4, wobbleFactor: 0.02 };
    }
  };

  const themeConfig = THEMES[theme] || THEMES.PASTEL;

  // Determine material type for sound
  const getMaterialForIndex = (index: number): MaterialType => {
    if (theme === 'MONOCHROME') {
      return index % 5 === 0 ? 'METAL' : 'CONCRETE';
    }
    if (theme === 'PASTEL') {
      return index % 4 === 0 ? 'WOOD' : 'CERAMIC';
    }
    if (theme === 'NEON') {
      return 'METAL';
    }
    return index % 3 === 0 ? 'METAL' : 'WOOD';
  };

  // Initialize Three.js Scene & Studio Lighting
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(themeConfig.fogColor, 0.028);
    sceneRef.current = scene;

    // Aspect-ratio adaptive FOV helper for all device screens
    const calculateFov = (aspectRatio: number) => {
      if (aspectRatio < 0.6) {
        return 58; // Ultra-tall phone portrait
      } else if (aspectRatio < 0.8) {
        return 52; // Standard mobile portrait
      } else if (aspectRatio < 1.1) {
        return 45; // Tablet / square screen
      } else if (aspectRatio > 2.2) {
        return 35; // Ultrawide monitor
      }
      return 40; // Desktop / laptop standard
    };

    // 2. Camera with aspect-adaptive FOV
    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(calculateFov(initialAspect), initialAspect, 0.1, 100);
    camera.position.set(5.2, 5.0, 5.2);
    camera.lookAt(0, 0.8, 0);
    cameraRef.current = camera;

    // 3. PBR WebGL Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Three-Point Studio Lighting Group
    const lightsGroup = new THREE.Group();
    
    // Ambient Soft Fill Light
    const ambientLight = new THREE.AmbientLight(themeConfig.ambientLight, 0.65);
    lightsGroup.add(ambientLight);

    // Key Directional Sun/Studio Light with soft shadow map
    const dirLight = new THREE.DirectionalLight(themeConfig.dirLight, 1.3);
    dirLight.position.set(7, 16, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const shadowSize = 6;
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.bias = -0.0004;
    lightsGroup.add(dirLight);

    // Rim Light to outline bevelled edges
    const rimLight = new THREE.DirectionalLight(themeConfig.rimLight, 0.8);
    rimLight.position.set(-8, 10, -8);
    lightsGroup.add(rimLight);

    scene.add(lightsGroup);
    lightsGroupRef.current = lightsGroup;

    // 5. Studio Base Pedestal
    const pedestalGeo = createBevelledBoxGeometry(3.2, 1.2, 3.2, 0.08);
    const { bumpMap, roughnessMap } = getConcreteTexture();
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: themeConfig.basePedestal,
      roughness: 0.45,
      metalness: 0.25,
      bumpMap,
      bumpScale: 0.005,
      roughnessMap,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.set(0, 0, 0);
    pedestalMesh.receiveShadow = true;
    pedestalMesh.castShadow = true;
    scene.add(pedestalMesh);
    pedestalMeshRef.current = pedestalMesh;

    // Soft Contact Shadow Plane
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.61;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Floating Ambient Dust Motes in Light Rays
    const motesCount = 60;
    const motesGeo = new THREE.BufferGeometry();
    const motesPos = new Float32Array(motesCount * 3);
    for (let i = 0; i < motesCount; i++) {
      motesPos[i * 3] = (Math.random() - 0.5) * 12;
      motesPos[i * 3 + 1] = Math.random() * 20;
      motesPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    motesGeo.setAttribute('position', new THREE.BufferAttribute(motesPos, 3));
    const motesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const ambientMotes = new THREE.Points(motesGeo, motesMat);
    scene.add(ambientMotes);
    ambientMotesRef.current = ambientMotes;

    resetGame();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      const newAspect = newWidth / newHeight;
      cameraRef.current.aspect = newAspect;
      cameraRef.current.fov = calculateFov(newAspect);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      soundEngine.updateMotionHum(0, false);
      renderer.dispose();
    };
  }, []);

  // Update Theme Colors & Studio Environment
  useEffect(() => {
    if (!sceneRef.current || !pedestalMeshRef.current) return;
    const cfg = THEMES[theme] || THEMES.PASTEL;
    sceneRef.current.fog = new THREE.FogExp2(cfg.fogColor, 0.028);
    (pedestalMeshRef.current.material as THREE.MeshStandardMaterial).color.set(cfg.basePedestal);

    // Update block materials with realistic textures
    blockMeshesRef.current.forEach((mesh, index) => {
      mesh.material = createRealisticBlockMaterial(cfg.getPaletteColor(index), index, theme);
    });
  }, [theme]);

  // Reset Game Logic
  const resetGame = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const config = getConfig();

    // Clear block meshes
    blockMeshesRef.current.forEach((mesh) => scene.remove(mesh));
    blockMeshesRef.current = [];
    blockSquashDataRef.current.clear();

    // Clear debris
    debrisListRef.current.forEach((item) => scene.remove(item.mesh));
    debrisListRef.current = [];

    // Clear dust particles
    if (dustParticlesRef.current) {
      scene.remove(dustParticlesRef.current.mesh);
      dustParticlesRef.current = null;
    }

    // Clear active moving block
    if (activeMovingMeshRef.current) {
      scene.remove(activeMovingMeshRef.current);
      activeMovingMeshRef.current = null;
    }

    // Reset game counters
    scoreRef.current = 0;
    comboCountRef.current = 0;
    perfectCountRef.current = 0;
    maxComboRef.current = 0;
    totalDropsRef.current = 0;
    placedBlocksRef.current = [];

    movingAxisRef.current = 'x';
    movePhaseRef.current = Math.PI / 2;
    timeScaleRef.current = 1.0;

    cameraTargetYRef.current = 1.2;
    currentCameraYRef.current = 1.2;
    towerWobbleAngleXRef.current = 0;
    towerWobbleAngleZRef.current = 0;
    wobbleVelocityXRef.current = 0;
    wobbleVelocityZRef.current = 0;
    towerCompressionRef.current = 0;
    compressionVelRef.current = 0;
    screenShakeRef.current = 0;

    if (cameraRef.current) {
      cameraRef.current.position.set(5.2, 5.4, 5.2);
      cameraRef.current.lookAt(0, 0.8, 0);
    }

    // Foundation block on pedestal
    const initialDim: BlockDimensions = {
      width: config.initialSize,
      depth: config.initialSize,
      height: 0.6,
    };
    const initialPos: Vector3D = { x: 0, y: 0.9, z: 0 };

    const initialBlock: PlacedBlock = {
      id: 0,
      position: initialPos,
      dimensions: initialDim,
      color: themeConfig.getPaletteColor(0),
      isPerfect: true,
    };

    placedBlocksRef.current.push(initialBlock);

    const blockGeo = createBevelledBoxGeometry(initialDim.width, initialDim.height, initialDim.depth, 0.04);
    const blockMat = createRealisticBlockMaterial(initialBlock.color, 0, theme);
    const blockMesh = new THREE.Mesh(blockGeo, blockMat);
    blockMesh.position.set(initialPos.x, initialPos.y, initialPos.z);
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    scene.add(blockMesh);
    blockMeshesRef.current.push(blockMesh);

    // Spawn first moving block
    spawnMovingBlock(initialDim, initialPos, 1);
  };

  // Spawn Next Moving Block
  const spawnMovingBlock = (prevDim: BlockDimensions, prevPos: Vector3D, newLevelIndex: number) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const config = getConfig();

    const newY = prevPos.y + prevDim.height;
    const axis = movingAxisRef.current;

    movePhaseRef.current = Math.PI / 2; // Start from smooth boundary

    const initialOffset = -config.moveRange;

    const movingPos: Vector3D = {
      x: axis === 'x' ? initialOffset : prevPos.x,
      y: newY,
      z: axis === 'z' ? initialOffset : prevPos.z,
    };

    const movingColor = themeConfig.getPaletteColor(newLevelIndex);
    const geo = createBevelledBoxGeometry(prevDim.width, prevDim.height, prevDim.depth, 0.04);
    const mat = createRealisticBlockMaterial(movingColor, newLevelIndex, theme);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(movingPos.x, movingPos.y, movingPos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (activeMovingMeshRef.current) {
      scene.remove(activeMovingMeshRef.current);
    }

    scene.add(mesh);
    activeMovingMeshRef.current = mesh;

    // Smooth Camera Target Height
    cameraTargetYRef.current = Math.max(1.2, newY - 0.4);
  };

  // Trigger Subtle Realistic Dust & Chip Particles on Impact
  const triggerDustPuff = (pos: Vector3D, size: BlockDimensions) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const count = 28;
    const particleGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.6,
    });

    const instancedMesh = new THREE.InstancedMesh(particleGeo, particleMat, count);
    const particlesData: { pos: THREE.Vector3; vel: THREE.Vector3; scale: number; alpha: number; maxLife: number; life: number }[] = [];

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * 4);
      let px = pos.x;
      let pz = pos.z;
      if (edge === 0) { px += size.width / 2; pz += (Math.random() - 0.5) * size.depth; }
      else if (edge === 1) { px -= size.width / 2; pz += (Math.random() - 0.5) * size.depth; }
      else if (edge === 2) { pz += size.depth / 2; px += (Math.random() - 0.5) * size.width; }
      else { pz -= size.depth / 2; px += (Math.random() - 0.5) * size.width; }

      const py = pos.y - size.height / 2;

      const pPos = new THREE.Vector3(px, py, pz);
      const vel = new THREE.Vector3(
        (px - pos.x) * (1.5 + Math.random() * 2),
        Math.random() * 0.8 + 0.2,
        (pz - pos.z) * (1.5 + Math.random() * 2)
      );

      dummy.position.copy(pPos);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      particlesData.push({
        pos: pPos,
        vel,
        scale: 0.8 + Math.random() * 1.2,
        alpha: 0.6,
        maxLife: 0.45 + Math.random() * 0.25,
        life: 0,
      });
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    dustParticlesRef.current = { mesh: instancedMesh, data: particlesData };
  };

  // Core Block Drop Logic
  const handleDropBlock = () => {
    if (gameState !== 'PLAYING' || !activeMovingMeshRef.current) return;

    soundEngine.updateMotionHum(0, false);

    const config = getConfig();
    const lastPlaced = placedBlocksRef.current[placedBlocksRef.current.length - 1];
    const activeMesh = activeMovingMeshRef.current;
    const axis = movingAxisRef.current;

    totalDropsRef.current += 1;

    const currentX = activeMesh.position.x;
    const currentZ = activeMesh.position.z;

    const prevX = lastPlaced.position.x;
    const prevZ = lastPlaced.position.z;

    const delta = axis === 'x' ? currentX - prevX : currentZ - prevZ;
    const absDelta = Math.abs(delta);
    const prevSize = axis === 'x' ? lastPlaced.dimensions.width : lastPlaced.dimensions.depth;

    const overlap = prevSize - absDelta;
    const materialType = getMaterialForIndex(scoreRef.current + 1);

    // Check if missed completely
    if (overlap <= 0) {
      // Missed! Create full falling debris
      createDebrisBlock(
        { ...lastPlaced.dimensions },
        { x: currentX, y: activeMesh.position.y, z: currentZ },
        { x: axis === 'x' ? Math.sign(delta || 1) * 1.8 : 0, y: -0.5, z: axis === 'z' ? Math.sign(delta || 1) * 1.8 : 0 },
        themeConfig.getPaletteColor(scoreRef.current + 1)
      );

      if (sceneRef.current) {
        sceneRef.current.remove(activeMesh);
        activeMovingMeshRef.current = null;
      }

      screenShakeRef.current = 0.32;
      soundEngine.playGameOverSound();

      const stats: GameStats = {
        score: scoreRef.current,
        heightMeters: Number((scoreRef.current * 0.6).toFixed(1)),
        perfectCount: perfectCountRef.current,
        maxCombo: maxComboRef.current,
        accuracyPercent: totalDropsRef.current > 0 
          ? Math.round((perfectCountRef.current / totalDropsRef.current) * 100) 
          : 0,
        totalBlocksDropped: totalDropsRef.current,
      };

      setTimeout(() => {
        onGameOver(stats);
      }, 550);
      return;
    }

    // Check for Perfect Drop
    let isPerfect = absDelta < config.perfectThreshold;

    let newWidth = lastPlaced.dimensions.width;
    let newDepth = lastPlaced.dimensions.depth;
    let newX = prevX;
    let newZ = prevZ;

    if (isPerfect) {
      // Snap 100% to center
      newX = prevX;
      newZ = prevZ;
      comboCountRef.current += 1;
      perfectCountRef.current += 1;
      if (comboCountRef.current > maxComboRef.current) {
        maxComboRef.current = comboCountRef.current;
      }

      if (comboCountRef.current >= 3) {
        const bonusExpansion = 0.08;
        newWidth = Math.min(config.initialSize, newWidth + bonusExpansion);
        newDepth = Math.min(config.initialSize, newDepth + bonusExpansion);
      }

      soundEngine.playPerfectSound(comboCountRef.current);
      soundEngine.playDropSound(comboCountRef.current, materialType);
      screenShakeRef.current = 0.05;

      // Micro slow-motion hit-stop effect
      timeScaleRef.current = 0.22;

      // Tower compression impact reaction
      compressionVelRef.current = -0.16;

      triggerDustPuff(
        { x: newX, y: activeMesh.position.y, z: newZ },
        { width: newWidth, depth: newDepth, height: 0.6 }
      );
    } else {
      // Partial Overlap - Cut/Slice
      comboCountRef.current = 0;
      soundEngine.playSliceSound();
      soundEngine.playDropSound(0, materialType);
      screenShakeRef.current = 0.10;

      compressionVelRef.current = -0.18;

      if (axis === 'x') {
        newWidth = overlap;
        newX = prevX + delta / 2;

        const sliceWidth = absDelta;
        const sliceX = newX + (delta > 0 ? newWidth / 2 + sliceWidth / 2 : -newWidth / 2 - sliceWidth / 2);
        
        createDebrisBlock(
          { width: sliceWidth, depth: newDepth, height: 0.6 },
          { x: sliceX, y: activeMesh.position.y, z: newZ },
          { x: delta > 0 ? 2.4 : -2.4, y: 0.8, z: (Math.random() - 0.5) * 1.2 },
          themeConfig.getPaletteColor(scoreRef.current + 1)
        );
      } else {
        newDepth = overlap;
        newZ = prevZ + delta / 2;

        const sliceDepth = absDelta;
        const sliceZ = newZ + (delta > 0 ? newDepth / 2 + sliceDepth / 2 : -newDepth / 2 - sliceDepth / 2);

        createDebrisBlock(
          { width: newWidth, depth: sliceDepth, height: 0.6 },
          { x: newX, y: activeMesh.position.y, z: sliceZ },
          { x: (Math.random() - 0.5) * 1.2, y: 0.8, z: delta > 0 ? 2.4 : -2.4 },
          themeConfig.getPaletteColor(scoreRef.current + 1)
        );
      }

      // Impart physical wobble velocity
      wobbleVelocityXRef.current += (axis === 'x' ? delta : 0) * config.wobbleFactor;
      wobbleVelocityZRef.current += (axis === 'z' ? delta : 0) * config.wobbleFactor;

      triggerDustPuff(
        { x: newX, y: activeMesh.position.y, z: newZ },
        { width: newWidth, depth: newDepth, height: 0.6 }
      );
    }

    if (sceneRef.current) {
      sceneRef.current.remove(activeMesh);
    }

    const newDim: BlockDimensions = { width: newWidth, depth: newDepth, height: 0.6 };
    const newPos: Vector3D = { x: newX, y: activeMesh.position.y, z: newZ };

    const newPlacedBlock: PlacedBlock = {
      id: scoreRef.current + 1,
      position: newPos,
      dimensions: newDim,
      color: themeConfig.getPaletteColor(scoreRef.current + 1),
      isPerfect,
    };

    placedBlocksRef.current.push(newPlacedBlock);

    // Create fixed mesh with realistic material
    const blockGeo = createBevelledBoxGeometry(newDim.width, newDim.height, newDim.depth, 0.04);
    const blockMat = createRealisticBlockMaterial(newPlacedBlock.color, scoreRef.current + 1, theme);
    const placedMesh = new THREE.Mesh(blockGeo, blockMat);
    placedMesh.position.set(newPos.x, newPos.y, newPos.z);
    placedMesh.castShadow = true;
    placedMesh.receiveShadow = true;

    // Apply Physical Squash/Stretch Impact Response
    blockSquashDataRef.current.set(placedMesh, {
      scaleY: 0.88,
      scaleXZ: 1.06,
      velY: 0,
      velXZ: 0,
    });

    if (sceneRef.current) {
      sceneRef.current.add(placedMesh);
    }
    blockMeshesRef.current.push(placedMesh);

    scoreRef.current += 1;
    onBlockPlaced(comboCountRef.current, isPerfect);
    onUpdateStats(scoreRef.current, Number((scoreRef.current * 0.6).toFixed(1)));

    movingAxisRef.current = axis === 'x' ? 'z' : 'x';
    spawnMovingBlock(newDim, newPos, scoreRef.current + 1);
  };

  // Helper to spawn falling slice debris block
  const createDebrisBlock = (
    size: BlockDimensions,
    pos: Vector3D,
    initialVelocity: Vector3D,
    color: string
  ) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    const geo = createBevelledBoxGeometry(size.width, size.height, size.depth, 0.03);
    const mat = createRealisticBlockMaterial(color, scoreRef.current + 1, theme);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    const debrisData: FallingDebris = {
      id: Math.random(),
      position: pos,
      dimensions: size,
      velocity: initialVelocity,
      angularVelocity: {
        x: (Math.random() - 0.5) * 7,
        y: (Math.random() - 0.5) * 7,
        z: (Math.random() - 0.5) * 7,
      },
      color,
      createdAt: performance.now(),
    };

    debrisListRef.current.push({ mesh, data: debrisData });
  };

  // Main Render & Physical Reaction Animation Loop
  useEffect(() => {
    const renderLoop = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      const rawDt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Time dilation for hit-stop
      if (timeScaleRef.current < 1.0) {
        timeScaleRef.current = Math.min(1.0, timeScaleRef.current + rawDt * 3.5);
      }
      const dt = rawDt * timeScaleRef.current;

      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const config = getConfig();

      if (!scene || !camera || !renderer) return;

      // 1. Moving Block Movement with smooth natural sinusoidal acceleration
      if (gameState === 'PLAYING' && activeMovingMeshRef.current) {
        const speed = config.baseSpeed + scoreRef.current * 0.05;
        movePhaseRef.current += speed * dt;

        const offset = Math.sin(movePhaseRef.current) * config.moveRange;
        const normalizedPos = offset / config.moveRange;

        soundEngine.updateMotionHum(normalizedPos, true);

        const lastPlaced = placedBlocksRef.current[placedBlocksRef.current.length - 1];
        if (movingAxisRef.current === 'x') {
          activeMovingMeshRef.current.position.x = lastPlaced.position.x + offset;
          activeMovingMeshRef.current.position.z = lastPlaced.position.z;
        } else {
          activeMovingMeshRef.current.position.x = lastPlaced.position.x;
          activeMovingMeshRef.current.position.z = lastPlaced.position.z + offset;
        }
      } else {
        soundEngine.updateMotionHum(0, false);
      }

      // 2. Physical Squash & Stretch Spring Dynamics
      blockSquashDataRef.current.forEach((data, mesh) => {
        const springK = 320;
        const damping = 18;

        const forceY = -springK * (data.scaleY - 1.0) - damping * data.velY;
        data.velY += forceY * dt;
        data.scaleY += data.velY * dt;

        const forceXZ = -springK * (data.scaleXZ - 1.0) - damping * data.velXZ;
        data.velXZ += forceXZ * dt;
        data.scaleXZ += data.velXZ * dt;

        mesh.scale.set(data.scaleXZ, data.scaleY, data.scaleXZ);

        if (Math.abs(data.scaleY - 1.0) < 0.002 && Math.abs(data.velY) < 0.002) {
          mesh.scale.set(1, 1, 1);
          blockSquashDataRef.current.delete(mesh);
        }
      });

      // 3. Physics Update for Debris
      for (let i = debrisListRef.current.length - 1; i >= 0; i--) {
        const item = debrisListRef.current[i];
        const { mesh, data } = item;

        data.velocity.y -= 12.0 * dt;

        data.position.x += data.velocity.x * dt;
        data.position.y += data.velocity.y * dt;
        data.position.z += data.velocity.z * dt;

        mesh.position.set(data.position.x, data.position.y, data.position.z);

        mesh.rotation.x += data.angularVelocity.x * dt;
        mesh.rotation.y += data.angularVelocity.y * dt;
        mesh.rotation.z += data.angularVelocity.z * dt;

        if (data.position.y < -8) {
          scene.remove(mesh);
          debrisListRef.current.splice(i, 1);
        }
      }

      // 4. Update Dust Particles
      if (dustParticlesRef.current) {
        const { mesh, data } = dustParticlesRef.current;
        const dummy = new THREE.Object3D();
        let activeCount = 0;

        for (let i = 0; i < data.length; i++) {
          const p = data[i];
          p.life += dt;

          if (p.life < p.maxLife) {
            p.pos.addScaledVector(p.vel, dt);
            p.vel.y -= 2.0 * dt;

            const lifeRatio = p.life / p.maxLife;
            const currentScale = p.scale * (1 + lifeRatio * 1.5);

            dummy.position.copy(p.pos);
            dummy.scale.setScalar(currentScale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);

            activeCount++;
          }
        }

        mesh.instanceMatrix.needsUpdate = true;

        if (activeCount === 0) {
          scene.remove(mesh);
          dustParticlesRef.current = null;
        }
      }

      // 5. Update Ambient Motes Floating
      if (ambientMotesRef.current) {
        const pos = ambientMotesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] += Math.sin(time * 0.001 + i) * 0.002;
        }
        ambientMotesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // 6. Tower Vertical Compression & Settling
      const springKComp = 220;
      const dampComp = 12;
      const accelComp = -springKComp * towerCompressionRef.current - dampComp * compressionVelRef.current;
      compressionVelRef.current += accelComp * dt;
      towerCompressionRef.current += compressionVelRef.current * dt;

      // 7. Tower Wobble Dynamics & Organic Creak Audio Trigger
      const springK = 18;
      const damping = 0.88;

      const accelX = -springK * towerWobbleAngleXRef.current;
      wobbleVelocityXRef.current = (wobbleVelocityXRef.current + accelX * dt) * damping;
      towerWobbleAngleXRef.current += wobbleVelocityXRef.current * dt;

      const accelZ = -springK * towerWobbleAngleZRef.current;
      wobbleVelocityZRef.current = (wobbleVelocityZRef.current + accelZ * dt) * damping;
      towerWobbleAngleZRef.current += wobbleVelocityZRef.current * dt;

      const wobbleMagnitude = Math.abs(towerWobbleAngleXRef.current) + Math.abs(towerWobbleAngleZRef.current);
      if (wobbleMagnitude > 0.03 && time - lastCreakTimeRef.current > 350) {
        soundEngine.playCreakSound();
        lastCreakTimeRef.current = time;
      }

      const totalBlocks = blockMeshesRef.current.length;
      blockMeshesRef.current.forEach((mesh, index) => {
        if (index > 0) {
          const heightRatio = index / totalBlocks;
          mesh.rotation.z = towerWobbleAngleXRef.current * heightRatio;
          mesh.rotation.x = towerWobbleAngleZRef.current * heightRatio;
        }
      });

      // 8. Smooth Camera Tracking with Impact Shake
      currentCameraYRef.current += (cameraTargetYRef.current - currentCameraYRef.current) * 4.5 * dt;

      let shakeX = 0;
      let shakeY = 0;
      if (screenShakeRef.current > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        screenShakeRef.current = Math.max(0, screenShakeRef.current - 1.5 * dt);
      }

      const effectiveCameraY = currentCameraYRef.current + towerCompressionRef.current;

      camera.position.set(
        5.2 + shakeX,
        effectiveCameraY + 4.2 + shakeY,
        5.2 + shakeX
      );
      camera.lookAt(0, effectiveCameraY - 0.2, 0);

      if (lightsGroupRef.current) {
        lightsGroupRef.current.position.y = effectiveCameraY;
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, difficulty, theme]);

  const prevGameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    const prev = prevGameStateRef.current;
    if (
      gameState === 'START' ||
      (gameState === 'PLAYING' && prev === 'GAMEOVER') ||
      (gameState === 'PLAYING' && scoreRef.current === 0 && placedBlocksRef.current.length <= 1)
    ) {
      resetGame();
    }
    prevGameStateRef.current = gameState;
  }, [gameState]);

  const lastInteractionTimeRef = useRef<number>(0);

  const handleInteraction = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = performance.now();
    if (now - lastInteractionTimeRef.current < 180) {
      return;
    }
    lastInteractionTimeRef.current = now;

    if (gameState === 'PLAYING') {
      handleDropBlock();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
        if (gameState === 'PLAYING') {
          e.preventDefault();
          handleDropBlock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="absolute inset-0 w-full h-full cursor-pointer touch-none select-none overflow-hidden"
    />
  );
};
