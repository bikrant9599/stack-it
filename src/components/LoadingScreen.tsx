import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { createBevelledBoxGeometry } from '../utils/geometry';
import { getWoodTexture, getConcreteTexture, getBrushedMetalTexture } from '../utils/materials';
import { soundEngine } from '../utils/audio';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  const [subtextVisible, setSubtextVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#030712', 0.032);

    // 2. Camera setup with aspect-ratio adaptive FOV
    const initialAspect = width / height;
    const camera = new THREE.PerspectiveCamera(38, initialAspect, 0.1, 100);
    
    const updateCameraProjection = (aspect: number) => {
      camera.aspect = aspect;
      if (aspect < 0.75) {
        // Ultra-narrow mobile portrait (e.g., 9:19.5 phones)
        camera.fov = 60;
      } else if (aspect < 1.0) {
        // Tablet/Standard mobile portrait
        camera.fov = 52;
      } else if (aspect > 2.2) {
        // Ultrawide monitors
        camera.fov = 34;
      } else {
        // Standard landscape / laptops / desktops
        camera.fov = 38;
      }
      camera.updateProjectionMatrix();
    };

    updateCameraProjection(initialAspect);
    camera.position.set(0, 3.8, 8.8);
    camera.lookAt(0, 1.0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Cinematic Lighting Setup
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.05); // Begins almost completely dark
    scene.add(ambientLight);

    // Primary volumetric spotlight revealing the architecture
    const spotLight = new THREE.SpotLight('#fef08a', 0.0, 32, Math.PI / 3.8, 0.6, 1.2);
    spotLight.position.set(4, 12, 6);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);

    // Soft cool rim backlight for separation
    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.0);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // Ground Contact Shadow Receiver
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.5;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Pedestal Base
    const pedestalGeo = createBevelledBoxGeometry(3.6, 0.8, 3.6, 0.08);
    const { bumpMap: concBump, roughnessMap: concRough } = getConcreteTexture();
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: '#1f2937',
      roughness: 0.55,
      metalness: 0.25,
      bumpMap: concBump,
      bumpScale: 0.005,
      roughnessMap: concRough,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.set(0, -0.1, 0);
    pedestalMesh.receiveShadow = true;
    pedestalMesh.castShadow = true;
    scene.add(pedestalMesh);

    // 5. Construct 3D Logo Block Monolith (STACK Architecture)
    const blocksGroup = new THREE.Group();
    scene.add(blocksGroup);

    const { bumpMap: metalBump, roughnessMap: metalRough } = getBrushedMetalTexture();
    const { bumpMap: woodBump, roughnessMap: woodRough } = getWoodTexture();

    // Material 1: Polished Gold Alloy
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      metalness: 0.88,
      roughness: 0.16,
      bumpMap: metalBump,
      bumpScale: 0.003,
      roughnessMap: metalRough,
    });

    // Material 2: Dark Obsidian Slate
    const slateMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.2,
      roughness: 0.6,
      bumpMap: concBump,
      bumpScale: 0.006,
      roughnessMap: concRough,
    });

    // Material 3: Scandinavian Satin Wood
    const woodMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.1,
      roughness: 0.35,
      bumpMap: woodBump,
      bumpScale: 0.004,
      roughnessMap: woodRough,
    });

    // 5 Staggered block levels
    const blockDefs = [
      { size: [2.2, 0.5, 2.2], mat: slateMat, targetY: 0.55, startOffset: [-4.0, 2.2, 0] },
      { size: [1.8, 0.5, 1.8], mat: woodMat, targetY: 1.05, startOffset: [4.0, 2.8, 0] },
      { size: [1.4, 0.5, 1.4], mat: goldMat, targetY: 1.55, startOffset: [0, 3.8, -4.0] },
      { size: [1.0, 0.5, 1.0], mat: slateMat, targetY: 2.05, startOffset: [0, 4.4, 4.0] },
      { size: [0.6, 0.5, 0.6], mat: goldMat, targetY: 2.55, startOffset: [-3.0, 5.0, 3.0] },
    ];

    const blockMeshes: {
      mesh: THREE.Mesh;
      startPos: THREE.Vector3;
      targetPos: THREE.Vector3;
      delay: number;
      duration: number;
    }[] = [];

    blockDefs.forEach((def, index) => {
      const geo = createBevelledBoxGeometry(def.size[0], def.size[1], def.size[2], 0.04);
      const mesh = new THREE.Mesh(geo, def.mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const startPos = new THREE.Vector3(def.startOffset[0], def.startOffset[1], def.startOffset[2]);
      const targetPos = new THREE.Vector3(0, def.targetY, 0);

      mesh.position.copy(startPos);
      blocksGroup.add(mesh);

      // Controlled slow timing for each block
      blockMeshes.push({
        mesh,
        startPos,
        targetPos,
        delay: 0.9 + index * 0.7, // Deliberately slow & staggered
        duration: 0.7,
      });
    });

    // 6. Volumetric Dust Particles
    const dustCount = 70;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 8;
      dustPos[i * 3 + 1] = Math.random() * 6;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.03,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Audio Sequence Trigger
    soundEngine.playIntroSoundSequence();

    // 7. Animation Loop & Kinematics
    let animFrameId: number;
    const startTime = performance.now();

    const renderLoop = (time: number) => {
      animFrameId = requestAnimationFrame(renderLoop);

      const elapsed = (time - startTime) / 1000; // Time in seconds

      // Soft light gradual fade-in
      const lightIntensity = Math.min(2.8, Math.pow(Math.max(0, elapsed - 0.1), 1.6) * 0.75);
      spotLight.intensity = lightIntensity;
      ambientLight.intensity = Math.min(0.42, elapsed * 0.08);
      rimLight.intensity = Math.min(0.85, Math.max(0, elapsed - 1.2) * 0.4);

      // Gentle sweep light movement across surfaces
      spotLight.position.x = 4 + Math.sin(elapsed * 0.35) * 1.6;

      // Heavy Physical Block Motion with Quartic Ease-Out Settle
      blockMeshes.forEach(({ mesh, startPos, targetPos, delay, duration }) => {
        if (elapsed > delay) {
          const rawT = Math.min(1.0, (elapsed - delay) / duration);
          // Smooth ease-out quartic curve
          const ease = 1 - Math.pow(1 - rawT, 4);

          mesh.position.x = THREE.MathUtils.lerp(startPos.x, targetPos.x, ease);
          mesh.position.y = THREE.MathUtils.lerp(startPos.y, targetPos.y, ease);
          mesh.position.z = THREE.MathUtils.lerp(startPos.z, targetPos.z, ease);

          // Subtle landing friction squash
          if (rawT >= 1.0) {
            const settleTime = elapsed - delay - duration;
            if (settleTime < 0.25) {
              const squash = Math.sin(settleTime * Math.PI * 8) * 0.025 * Math.exp(-settleTime * 10);
              mesh.scale.set(1 + squash, 1 - squash, 1 + squash);
            } else {
              mesh.scale.set(1, 1, 1);
            }
          }
        }
      });

      // Camera Slow Push-In Dolly Shot (Decelerates into near stillness)
      const camDollyProgress = Math.min(1.0, elapsed / 5.5);
      // Ease-out sine curve makes motion progressively slower & calmer
      const easeDolly = Math.sin((camDollyProgress * Math.PI) / 2);

      camera.position.z = THREE.MathUtils.lerp(8.8, 6.4, easeDolly);
      camera.position.y = THREE.MathUtils.lerp(3.8, 2.3, easeDolly);
      camera.lookAt(0, 1.25, 0);

      // Microscopic smooth monolith rotation
      blocksGroup.rotation.y = Math.sin(elapsed * 0.25) * 0.12;

      // Dust motes float imperceptibly through the light
      const posArr = dustPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i++) {
        posArr[i * 3 + 1] += Math.sin(elapsed * 0.5 + i) * 0.001 + 0.0006;
        if (posArr[i * 3 + 1] > 6) posArr[i * 3 + 1] = 0;
      }
      dustPoints.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    // Timed UI Text Reveals
    const textTimer = setTimeout(() => setTextVisible(true), 4200);
    const subtextTimer = setTimeout(() => setSubtextVisible(true), 4600);

    // Transition to main menu after ~6.2 seconds
    const completeTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 750);
    }, 6200);

    // Resize Handler with Aspect-Adaptive FOV
    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      const newAspect = nw / nh;
      renderer.setSize(nw, nh);
      updateCameraProjection(newAspect);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      clearTimeout(textTimer);
      clearTimeout(subtextTimer);
      clearTimeout(completeTimer);
      renderer.dispose();
    };
  }, []);

  const handleSkip = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer select-none touch-none z-50"
    >
      {/* 3D WebGL Canvas Layer - Full Viewport Responsive Coverage */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Film Grain & Cinematic Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_35%,rgba(3,7,18,0.85)_100%)]" />

      {/* Motion Blur Cinematic Glow Effect */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen bg-amber-500/5 blur-3xl opacity-60" />

      {/* Proportional & Safe Responsive Branding Overlay */}
      <div className="absolute inset-x-0 bottom-12 sm:bottom-16 md:bottom-20 pb-safe z-10 flex flex-col items-center justify-center text-center px-6">
        <AnimatePresence>
          {textVisible && (
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="flex flex-col items-center space-y-1"
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.3em] sm:tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 drop-shadow-[0_4px_28px_rgba(217,119,6,0.5)] uppercase font-mono">
                STACK IT
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {subtextVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="mt-2 sm:mt-3"
            >
              <p className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.4em] sm:tracking-[0.45em] text-slate-300/90 uppercase font-sans">
                MADE BY BIKRANT
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Fade Out Curtain on Completion */}
      <div
        className={`absolute inset-0 bg-slate-950 transition-opacity duration-700 pointer-events-none z-30 ${
          isFadingOut ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
