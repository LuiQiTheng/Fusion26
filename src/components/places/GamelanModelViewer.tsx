import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface GamelanModelViewerProps {
  modelUrl?: string;
  className?: string;
}

const BONANG_SHORTCUTS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'];

export const GamelanModelViewer: React.FC<GamelanModelViewerProps> = ({
  modelUrl = '/models/gamelan.glb',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Audio & 3D References
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const htmlAudioPoolRef = useRef<Map<string, HTMLAudioElement[]>>(new Map());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelMeshRef = useRef<THREE.Object3D | null>(null);
  const strikeLightRef = useRef<THREE.PointLight | null>(null);
  const shockwavesRef = useRef<Array<{ mesh: THREE.Mesh; createdAt: number; duration: number }>>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Preload and decode audio files
  useEffect(() => {
    const audioFiles: Record<string, string> = {
      gong: '/audio/gong.mp3',
    };
    for (let i = 1; i <= 7; i++) {
      audioFiles[`bonang${i}`] = `/audio/bonang${i}.mp3`;
      audioFiles[`high${i}`] = `/audio/High%20${i}.mp3`;
    }

    // Initialize Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.9;
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        Object.entries(audioFiles).forEach(([key, url]) => {
          fetch(url)
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.arrayBuffer();
            })
            .then((buf) => ctx.decodeAudioData(buf))
            .then((decoded) => {
              audioBuffersRef.current.set(key, decoded);
            })
            .catch((err) => {
              console.warn(`WebAudio decode fallback for ${key}:`, err);
            });
        });
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }

    // HTML5 Audio fallback pool
    Object.entries(audioFiles).forEach(([key, url]) => {
      const pool: HTMLAudioElement[] = [];
      for (let p = 0; p < 2; p++) {
        const a = new Audio(url);
        a.preload = 'auto';
        pool.push(a);
      }
      htmlAudioPoolRef.current.set(key, pool);
    });

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Spawn visual shockwave in 3D
  const spawnVisualShockwave = useCallback((worldPos: THREE.Vector3, colorHex: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ringGeo = new THREE.RingGeometry(0.04, 0.08, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.copy(worldPos);
    ringMesh.position.y += 0.02;
    scene.add(ringMesh);

    shockwavesRef.current.push({
      mesh: ringMesh,
      createdAt: performance.now(),
      duration: 450,
    });

    if (strikeLightRef.current) {
      strikeLightRef.current.position.copy(worldPos);
      strikeLightRef.current.position.y += 0.25;
      strikeLightRef.current.color.setHex(colorHex);
      strikeLightRef.current.intensity = 3.0;
    }
  }, []);

  // Compute instrument 3D local coordinate
  const getInstrumentLocalPosition = useCallback((category: 'gong' | 'bonang' | 'high', noteIndex?: number): THREE.Vector3 => {
    if (category === 'gong') {
      return new THREE.Vector3(0.25, 0.15, -0.20);
    }
    const segWidth = (0.88 - (-0.65)) / 7;
    const idx = (noteIndex ?? 1) - 1;
    const x = -0.65 + (idx + 0.5) * segWidth;
    if (category === 'high') {
      return new THREE.Vector3(x, -0.26, 0.29);
    } else {
      return new THREE.Vector3(x, -0.26, -0.01);
    }
  }, []);

  // Play instrument (Audio + 3D shockwave)
  const playInstrument = useCallback(
    (category: 'gong' | 'bonang' | 'high', noteIndex?: number, hitWorldPos?: THREE.Vector3) => {
      const audioKey = category === 'gong' ? 'gong' : `${category}${noteIndex || 1}`;
      const colorHex = category === 'gong' ? 0xc5a028 : category === 'bonang' ? 0xd4a346 : 0x087e83;

      // 1. Play sound with Web Audio API or fallback pool
      const ctx = audioContextRef.current;
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const buffer = audioBuffersRef.current.get(audioKey);
        if (buffer && masterGainRef.current) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(masterGainRef.current);
          source.start(0);
        } else {
          const pool = htmlAudioPoolRef.current.get(audioKey);
          if (pool && pool.length > 0) {
            const audioElem = pool.find((a) => a.paused) || pool[0];
            audioElem.currentTime = 0;
            audioElem.play().catch(() => {});
          }
        }
      }

      // 2. 3D Visual Strike Shockwave
      let finalWorldPos = hitWorldPos;
      if (!finalWorldPos && modelMeshRef.current) {
        const localPos = getInstrumentLocalPosition(category, noteIndex);
        finalWorldPos = localPos.clone();
        modelMeshRef.current.localToWorld(finalWorldPos);
      }

      if (finalWorldPos) {
        spawnVisualShockwave(finalWorldPos, colorHex);
      }
    },
    [getInstrumentLocalPosition, spawnVisualShockwave]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      if (key === ' ' || key === 'G') {
        e.preventDefault();
        playInstrument('gong');
        return;
      }

      if (key >= '1' && key <= '7') {
        e.preventDefault();
        playInstrument('high', parseInt(key, 10));
        return;
      }

      const bonangIndex = BONANG_SHORTCUTS.indexOf(key);
      if (bonangIndex !== -1) {
        e.preventDefault();
        playInstrument('bonang', bonangIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playInstrument]);

  // Three.js scene setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;
    setLoading(true);
    setLoadProgress(0);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 3.2);
    cameraRef.current = camera;

    // Renderer: 100% transparent background, same as food and building
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0); // 100% Transparent
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // OrbitControls: user can inspect the instruments
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -0.15, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 1.2;
    controls.maxDistance = 5.0;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 3.0);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.4);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontFillLight.position.set(0, 2, 6);
    scene.add(frontFillLight);

    // Dynamic Strike Flash Light
    const strikeLight = new THREE.PointLight(0xc5a028, 0, 4, 1.5);
    scene.add(strikeLight);
    strikeLightRef.current = strikeLight;

    // Model Group (Pure 3D model, no artificial stage/pedestal, matching food)
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Load gamelan.glb
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        // Center model geometry at (0, 0, 0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Normalize scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.45 / (maxDim || 1);
        model.scale.setScalar(targetScale);

        modelGroup.add(model);
        modelMeshRef.current = model;
        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else if (xhr.loaded > 0) {
          setLoadProgress(Math.min(95, Math.round((xhr.loaded / (11 * 1024 * 1024)) * 100)));
        }
      },
      (err) => {
        if (isDisposed) return;
        console.error('Failed to load Gamelan 3D model:', err);
        setLoading(false);
      }
    );

    // Raycaster on pointer down/up (distinguishes clicks from camera drags)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 7) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      if (!modelMeshRef.current) return;

      const intersects = raycaster.intersectObjects([modelMeshRef.current], true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const localPoint = modelMeshRef.current.worldToLocal(hit.point.clone());

        // Instrument spatial mapping:
        // 1. Gong: elevated back structure
        if (localPoint.y >= -0.12 && localPoint.z <= 0.05) {
          playInstrument('gong', undefined, hit.point);
        } else if (localPoint.z > 0.14) {
          // 2. High mesh / Saron in the front rack
          const segWidth = (0.88 - (-0.65)) / 7;
          const noteIndex = Math.min(7, Math.max(1, Math.floor((localPoint.x - (-0.65)) / segWidth) + 1));
          playInstrument('high', noteIndex, hit.point);
        } else {
          // 3. Bonang pots in the mid rack
          const segWidth = (0.88 - (-0.65)) / 7;
          const noteIndex = Math.min(7, Math.max(1, Math.floor((localPoint.x - (-0.65)) / segWidth) + 1));
          playInstrument('bonang', noteIndex, hit.point);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      if (!modelMeshRef.current) return;

      const intersects = raycaster.intersectObjects([modelMeshRef.current], true);
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointermove', handlePointerMove);

    // Animation loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      const now = performance.now();
      const activeShockwaves: Array<{ mesh: THREE.Mesh; createdAt: number; duration: number }> = [];

      shockwavesRef.current.forEach((sw) => {
        const elapsed = now - sw.createdAt;
        const progress = elapsed / sw.duration;
        if (progress < 1.0) {
          const scale = 1.0 + progress * 3.5;
          sw.mesh.scale.set(scale, scale, scale);
          const mat = sw.mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = Math.max(0, 0.95 * (1.0 - progress));
          activeShockwaves.push(sw);
        } else {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.Material).dispose();
        }
      });
      shockwavesRef.current = activeShockwaves;

      if (strikeLightRef.current && strikeLightRef.current.intensity > 0) {
        strikeLightRef.current.intensity = Math.max(0, strikeLightRef.current.intensity - 0.18);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointermove', handlePointerMove);

      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      controls.dispose();

      modelGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      shockwavesRef.current.forEach((sw) => {
        scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        (sw.mesh.material as THREE.Material).dispose();
      });

      renderer.dispose();
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    };
  }, [modelUrl, playInstrument]);

  return (
    <div className={`relative flex items-center justify-center bg-transparent select-none w-full h-full ${className}`}>
      {/* 3D WebGL Canvas Viewport (100% Transparent, identical to food and building) */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent select-none" />

      {/* Loading Indicator matching food/building style */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs pointer-events-none z-30">
          <div className="px-4 py-2.5 rounded-2xl bg-[#EBF5F0] border border-teal-900/15 text-[#0A2F25] flex items-center gap-2.5 shadow-md">
            <div className="w-4 h-4 rounded-full border-2 border-[#C5A028] border-t-transparent animate-spin" />
            <span className="text-xs font-mono font-medium">
              Loading 3D Model {loadProgress > 0 ? `${loadProgress}%` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
