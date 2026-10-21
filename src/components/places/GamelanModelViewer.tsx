import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Music,
  Info,
  Layers,
} from 'lucide-react';

interface GamelanModelViewerProps {
  modelUrl?: string;
  className?: string;
  onClose?: () => void;
}

// 7 pentatonic Malay Gamelan pitch names for authentic cultural representation
const GAMELAN_PITCHES = [
  { index: 1, name: 'Barang', solfege: '1 (Do)' },
  { index: 2, name: 'Gulu', solfege: '2 (Re)' },
  { index: 3, name: 'Dhadha', solfege: '3 (Mi)' },
  { index: 4, name: 'Pelog', solfege: '4 (Fa#)' },
  { index: 5, name: 'Lima', solfege: '5 (Sol)' },
  { index: 6, name: 'Nem', solfege: '6 (La)' },
  { index: 7, name: 'Barang Alit', solfege: '7 (Si)' },
];

const BONANG_KEY_SHORTCUTS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U'];
const HIGH_KEY_SHORTCUTS = ['1', '2', '3', '4', '5', '6', '7'];

interface ActiveStrike {
  id: string;
  label: string;
  category: 'gong' | 'bonang' | 'high';
  noteIndex?: number;
}

export const GamelanModelViewer: React.FC<GamelanModelViewerProps> = ({
  modelUrl = '/models/gamelan.glb',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [activeStrike, setActiveStrike] = useState<ActiveStrike | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [activeCameraView, setActiveCameraView] = useState<'stage' | 'bonang' | 'high' | 'gong'>('stage');
  const [autoRotate, setAutoRotate] = useState(false);

  // Audio & 3D References
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const htmlAudioPoolRef = useRef<Map<string, HTMLAudioElement[]>>(new Map());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const modelMeshRef = useRef<THREE.Object3D | null>(null);
  const strikeLightRef = useRef<THREE.PointLight | null>(null);
  const shockwavesRef = useRef<Array<{ mesh: THREE.Mesh; createdAt: number; duration: number }>>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const demoTimeoutsRef = useRef<number[]>([]);

  // Instrument 3D target coordinates (in model local coordinate space)
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
      // bonang
      return new THREE.Vector3(x, -0.26, -0.01);
    }
  }, []);

  // 1. Audio Engine Initialization
  useEffect(() => {
    const audioFiles: Record<string, string> = {
      gong: '/audio/gong.mp3',
    };
    for (let i = 1; i <= 7; i++) {
      audioFiles[`bonang${i}`] = `/audio/bonang${i}.mp3`;
      audioFiles[`high${i}`] = `/audio/High%20${i}.mp3`;
    }

    // Try Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Preload & decode all 15 audio files into memory
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
      console.warn('Web Audio API not supported, falling back to HTML5 Audio', e);
    }

    // Prepare HTML5 Audio fallback pool (2 audio instances per sound for polyphony)
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

  // Sync master volume
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Spawn visual shockwave in 3D
  const spawnVisualShockwave = useCallback((worldPos: THREE.Vector3, colorHex: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Ring shockwave expanding horizontally
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
      duration: 500,
    });

    // Flash strike point light
    if (strikeLightRef.current) {
      strikeLightRef.current.position.copy(worldPos);
      strikeLightRef.current.position.y += 0.25;
      strikeLightRef.current.color.setHex(colorHex);
      strikeLightRef.current.intensity = 3.5;
    }
  }, []);

  // Main Instrument Trigger (Plays Audio + Spawns 3D Effects + Updates HUD)
  const playInstrument = useCallback(
    (category: 'gong' | 'bonang' | 'high', noteIndex?: number, hitWorldPos?: THREE.Vector3) => {
      const audioKey = category === 'gong' ? 'gong' : `${category}${noteIndex || 1}`;
      const colorHex = category === 'gong' ? 0xffd700 : category === 'bonang' ? 0xf59e0b : 0x06b6d4;

      // 1. Play Sound
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
          // Fallback to HTML5 audio pool
          const pool = htmlAudioPoolRef.current.get(audioKey);
          if (pool && pool.length > 0) {
            const audioElem = pool.find((a) => a.paused) || pool[0];
            audioElem.currentTime = 0;
            audioElem.volume = isMuted ? 0 : volume;
            audioElem.play().catch(() => {});
          }
        }
      }

      // 2. Compute 3D world position for visual strike effect if not provided
      let finalWorldPos = hitWorldPos;
      if (!finalWorldPos && modelMeshRef.current) {
        const localPos = getInstrumentLocalPosition(category, noteIndex);
        finalWorldPos = localPos.clone();
        modelMeshRef.current.localToWorld(finalWorldPos);
      }

      if (finalWorldPos) {
        spawnVisualShockwave(finalWorldPos, colorHex);
      }

      // 3. Set Active HUD State
      let label = 'Gong Ageng';
      if (category === 'bonang') {
        const pitch = GAMELAN_PITCHES[(noteIndex || 1) - 1];
        label = `Bonang #${noteIndex} (${pitch?.name || ''})`;
      } else if (category === 'high') {
        const pitch = GAMELAN_PITCHES[(noteIndex || 1) - 1];
        label = `High Saron #${noteIndex} (${pitch?.name || ''})`;
      }

      setActiveStrike({
        id: `${category}-${noteIndex || '0'}-${Date.now()}`,
        label,
        category,
        noteIndex,
      });

      // Reset active strike after short interval for snappy pulse
      setTimeout(() => {
        setActiveStrike((prev) => (prev && prev.label === label ? null : prev));
      }, 240);
    },
    [getInstrumentLocalPosition, isMuted, spawnVisualShockwave, volume]
  );

  // Stop Demo Song
  const stopDemoSong = useCallback(() => {
    demoTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    demoTimeoutsRef.current = [];
    setIsPlayingDemo(false);
  }, []);

  // Traditional Malay Gamelan Demo Pattern
  const playDemoSong = useCallback(() => {
    stopDemoSong();
    setIsPlayingDemo(true);

    // Traditional court motif: Opening Gong -> High Saron melody with interlocking Bonang
    const sequence: Array<{ delay: number; category: 'gong' | 'bonang' | 'high'; note?: number }> = [
      // Regal Gong Ageng Opening
      { delay: 0, category: 'gong' },

      // High Saron Phrase 1
      { delay: 800, category: 'high', note: 1 },
      { delay: 1100, category: 'bonang', note: 1 },
      { delay: 1400, category: 'high', note: 2 },
      { delay: 1700, category: 'bonang', note: 3 },
      { delay: 2000, category: 'high', note: 3 },
      { delay: 2300, category: 'bonang', note: 5 },
      { delay: 2600, category: 'high', note: 5 },

      // Interlocking Ornamentation
      { delay: 2900, category: 'bonang', note: 6 },
      { delay: 3200, category: 'high', note: 6 },
      { delay: 3500, category: 'bonang', note: 5 },
      { delay: 3800, category: 'high', note: 3 },
      { delay: 4100, category: 'bonang', note: 2 },
      { delay: 4400, category: 'high', note: 1 },

      // Climactic cadence & resolving Gong strike
      { delay: 4700, category: 'bonang', note: 7 },
      { delay: 5000, category: 'high', note: 7 },
      { delay: 5300, category: 'bonang', note: 1 },
      { delay: 5600, category: 'gong' },
      { delay: 5650, category: 'high', note: 1 },
    ];

    sequence.forEach((step) => {
      const tid = window.setTimeout(() => {
        playInstrument(step.category, step.note);
      }, step.delay);
      demoTimeoutsRef.current.push(tid);
    });

    const finishTid = window.setTimeout(() => {
      setIsPlayingDemo(false);
    }, 7200);
    demoTimeoutsRef.current.push(finishTid);
  }, [playInstrument, stopDemoSong]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      demoTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing input if user is in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();

      // Gong
      if (key === ' ' || key === 'G') {
        e.preventDefault();
        playInstrument('gong');
        return;
      }

      // High Keys: 1 to 7
      if (key >= '1' && key <= '7') {
        e.preventDefault();
        const note = parseInt(key, 10);
        playInstrument('high', note);
        return;
      }

      // Bonang: Q, W, E, R, T, Y, U
      const bonangIndex = BONANG_KEY_SHORTCUTS.indexOf(key);
      if (bonangIndex !== -1) {
        e.preventDefault();
        playInstrument('bonang', bonangIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playInstrument]);

  // Camera presets
  const setCameraPreset = useCallback((preset: 'stage' | 'bonang' | 'high' | 'gong') => {
    setActiveCameraView(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'stage') {
      camera.position.set(0, 1.6, 2.9);
      controls.target.set(0, -0.15, 0);
    } else if (preset === 'bonang') {
      camera.position.set(0, 1.15, 1.6);
      controls.target.set(0, -0.25, -0.01);
    } else if (preset === 'high') {
      camera.position.set(0, 1.0, 1.5);
      controls.target.set(0, -0.25, 0.28);
    } else if (preset === 'gong') {
      camera.position.set(0.35, 1.25, 1.85);
      controls.target.set(0.25, 0.1, -0.2);
    }
    controls.update();
  }, []);

  // 2. Three.js Scene Setup & Raycasting
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;
    setLoading(true);
    setLoadProgress(0);

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: elevated stage view
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 2.9);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // OrbitControls: interactive inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -0.15, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go below floor
    controls.minDistance = 0.9;
    controls.maxDistance = 6.0;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lighting for Bronze & Royal Woodcraft
    const ambientLight = new THREE.AmbientLight(0xfff3e0, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffe2a4, 3.2);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x90e0ef, 1.6);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const frontFillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    frontFillLight.position.set(0, 2, 6);
    scene.add(frontFillLight);

    // Dynamic Strike Flash Light
    const strikeLight = new THREE.PointLight(0xffd700, 0, 4, 1.5);
    scene.add(strikeLight);
    strikeLightRef.current = strikeLight;

    // Model Container
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Load gamelan.glb
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        // Center model geometry
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

        // Royal Court Pedestal / Dais with traditional gold trim
        const daisRadius = Math.max(1.65, Math.hypot(size.x, size.z) * 0.5 * targetScale * 1.08);
        const daisGeo = new THREE.CylinderGeometry(daisRadius, daisRadius + 0.08, 0.14, 64);
        const daisMat = new THREE.MeshStandardMaterial({
          color: 0x16221e,
          metalness: 0.8,
          roughness: 0.35,
          transparent: true,
          opacity: 0.85,
        });
        const dais = new THREE.Mesh(daisGeo, daisMat);
        const daisY = (-size.y * 0.5) * targetScale - 0.07;
        dais.position.y = daisY;
        modelGroup.add(dais);

        // Gold inlay trim ring on dais
        const goldTrimGeo = new THREE.RingGeometry(daisRadius * 0.94, daisRadius * 0.99, 64);
        const goldTrimMat = new THREE.MeshBasicMaterial({
          color: 0xc5a028,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const goldTrim = new THREE.Mesh(goldTrimGeo, goldTrimMat);
        goldTrim.rotation.x = -Math.PI / 2;
        goldTrim.position.y = daisY + 0.071;
        modelGroup.add(goldTrim);

        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else if (xhr.loaded > 0) {
          const approx = Math.min(95, Math.round((xhr.loaded / (11 * 1024 * 1024)) * 100));
          setLoadProgress(approx);
        }
      },
      (err) => {
        if (isDisposed) return;
        console.error('Failed to load Gamelan 3D model:', err);
        setLoading(false);
      }
    );

    // Raycaster Interaction on Pointer Down / Up (distinguishes clicks from camera orbit drags)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 7) return; // User was dragging the camera, not clicking

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      if (!modelMeshRef.current) return;

      const intersects = raycaster.intersectObjects([modelMeshRef.current], true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const localPoint = modelMeshRef.current.worldToLocal(hit.point.clone());

        // Instrument detection using 3D local coordinates:
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
        const hit = intersects[0];
        const localPoint = modelMeshRef.current.worldToLocal(hit.point.clone());
        renderer.domElement.style.cursor = 'pointer';

        if (localPoint.y >= -0.12 && localPoint.z <= 0.05) {
          setHoveredPart('Gong Ageng (Click to Strike)');
        } else if (localPoint.z > 0.14) {
          const segWidth = (0.88 - (-0.65)) / 7;
          const noteIndex = Math.min(7, Math.max(1, Math.floor((localPoint.x - (-0.65)) / segWidth) + 1));
          const p = GAMELAN_PITCHES[noteIndex - 1];
          setHoveredPart(`High Saron #${noteIndex} - ${p?.name} (Click to Strike)`);
        } else {
          const segWidth = (0.88 - (-0.65)) / 7;
          const noteIndex = Math.min(7, Math.max(1, Math.floor((localPoint.x - (-0.65)) / segWidth) + 1));
          const p = GAMELAN_PITCHES[noteIndex - 1];
          setHoveredPart(`Bonang #${noteIndex} - ${p?.name} (Click to Strike)`);
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredPart(null);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointermove', handlePointerMove);

    // Animation Render Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();

      // Animate 3D shockwave rings
      const now = performance.now();
      const activeShockwaves: Array<{ mesh: THREE.Mesh; createdAt: number; duration: number }> = [];

      shockwavesRef.current.forEach((sw) => {
        const elapsed = now - sw.createdAt;
        const progress = elapsed / sw.duration;
        if (progress < 1.0) {
          const scale = 1.0 + progress * 3.8;
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

      // Fade out dynamic strike flash light
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

    // Cleanup
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

  // Sync autoRotate state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/80 backdrop-blur-md border border-amber-500/20 text-white select-none ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl border-amber-500/40' : className
      }`}
    >
      {/* Top Header / HUD Control Bar */}
      <div className="relative z-30 w-full px-4 py-3 flex items-center justify-between border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-900/40">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-amber-200">Virtual Malay Gamelan</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                iPlay Virtual Stage
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Interactive 3D bronze ensemble • Click instruments or press 1-7, Q-U, Space
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Demo Song Button */}
          <button
            onClick={isPlayingDemo ? stopDemoSong : playDemoSong}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isPlayingDemo
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
            }`}
            title={isPlayingDemo ? 'Stop Demo Song' : 'Play authentic Malay Gamelan demo phrase'}
          >
            {isPlayingDemo ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlayingDemo ? 'Stop Song' : 'Demo Melody'}</span>
          </button>

          {/* Volume / Mute Toggle */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-14 sm:w-20 h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>

          {/* Camera Reset */}
          <button
            onClick={() => setCameraPreset('stage')}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset to Stage View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Theater Mode' : 'Expand to Theater Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative w-full flex-1 min-h-[300px] sm:min-h-[380px] xl:min-h-[440px]">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-40">
            <div className="px-6 py-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-amber-200 flex flex-col items-center gap-3 shadow-2xl">
              <div className="w-8 h-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              <div className="text-center space-y-1">
                <span className="text-sm font-semibold tracking-wide">Tuning Virtual Gamelan...</span>
                <p className="text-xs text-slate-400">Loading 3D Bronze Acoustics {loadProgress > 0 ? `${loadProgress}%` : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Active Strike Toast / Notification */}
        {activeStrike && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`px-4 py-2 rounded-2xl flex items-center gap-2 border shadow-xl backdrop-blur-md text-xs font-bold ${
                activeStrike.category === 'gong'
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-amber-900/40 ring-2 ring-amber-400/50'
                  : activeStrike.category === 'bonang'
                  ? 'bg-yellow-950/80 border-yellow-400 text-yellow-200 shadow-yellow-900/40'
                  : 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-cyan-900/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>{activeStrike.label}</span>
            </div>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPart && !activeStrike && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/20 text-slate-200 text-xs shadow-lg backdrop-blur-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{hoveredPart}</span>
            </div>
          </div>
        )}

        {/* Quick Camera Preset Pills (Left Side) */}
        <div className="absolute left-3 top-3 z-30 flex flex-col gap-1.5 pointer-events-auto">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">Angle</span>
          {[
            { id: 'stage', label: 'Stage' },
            { id: 'bonang', label: 'Bonang' },
            { id: 'high', label: 'High Saron' },
            { id: 'gong', label: 'Gong' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setCameraPreset(preset.id as 'stage' | 'bonang' | 'high' | 'gong')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer text-left ${
                activeCameraView === preset.id
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-900/40'
                  : 'bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`mt-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              autoRotate ? 'bg-teal-600/80 text-white' : 'bg-black/40 hover:bg-black/60 text-slate-400 border border-white/10'
            }`}
            title="Auto-rotate 3D stage"
          >
            <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>Spin</span>
          </button>
        </div>

        {/* Instructions Hint (Right Side) */}
        <div className="absolute right-3 top-3 z-30 hidden sm:flex flex-col items-end gap-1 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[10px] text-slate-300 backdrop-blur-xs flex items-center gap-1.5">
            <Info className="w-3 h-3 text-amber-300" />
            <span>Click 3D instruments directly to play</span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Soundboard / Keyboard Bar (iPlayMusic Style) */}
      <div className="relative z-30 w-full p-3 sm:p-4 bg-gradient-to-t from-black via-slate-950/95 to-slate-900/90 border-t border-amber-500/20 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-amber-300/90 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Virtual Soundboard
          </span>
          <span className="text-[11px] text-slate-400">
            Keyboard: <span className="font-mono text-amber-300">Space</span> (Gong) •{' '}
            <span className="font-mono text-yellow-300">Q-U</span> (Bonang) •{' '}
            <span className="font-mono text-cyan-300">1-7</span> (High Saron)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* 1. Gong Ageng Button (Col 2 on MD) */}
          <div className="md:col-span-2 flex justify-center">
            <button
              onClick={() => playInstrument('gong')}
              className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                activeStrike?.category === 'gong'
                  ? 'bg-amber-400 border-white text-slate-950 ring-4 ring-amber-400/50 scale-105 shadow-xl'
                  : 'bg-gradient-to-b from-amber-700/80 to-amber-900/90 hover:from-amber-600 hover:to-amber-800 border-amber-500/50 text-amber-100 shadow-md shadow-amber-950/60'
              }`}
              title="Strike Gong Ageng (Keyboard: Space or G)"
            >
              <div className="w-5 h-5 rounded-full border-2 border-amber-300/60 bg-amber-500/40 flex items-center justify-center font-bold text-[10px]">
                G
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-tight">Gong Ageng</div>
                <div className="text-[9px] text-amber-200/80 font-mono">[Space]</div>
              </div>
            </button>
          </div>

          {/* 2. Bonang (Keromong) 7 Kettle Buttons (Col 5 on MD) */}
          <div className="md:col-span-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-amber-200/80 font-medium px-1">
              <span>Bonang Pots (Keromong)</span>
              <span className="font-mono text-[9px] text-slate-400">Keys: Q, W, E, R, T, Y, U</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {GAMELAN_PITCHES.map((p, idx) => {
                const isActive = activeStrike?.category === 'bonang' && activeStrike.noteIndex === p.index;
                return (
                  <button
                    key={`bonang-${p.index}`}
                    onClick={() => playInstrument('bonang', p.index)}
                    className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300 scale-105 shadow-lg'
                        : 'bg-gradient-to-b from-yellow-800/60 to-amber-950/80 hover:from-yellow-700 hover:to-amber-900 text-yellow-100 border-yellow-600/30 shadow-xs'
                    }`}
                    title={`Bonang Note ${p.index}: ${p.name} (${p.solfege}) [Key: ${BONANG_KEY_SHORTCUTS[idx]}]`}
                  >
                    <span className="text-[11px] font-bold leading-none">{p.index}</span>
                    <span className="text-[9px] opacity-75 font-mono leading-none mt-0.5">
                      {BONANG_KEY_SHORTCUTS[idx]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. High Mesh / Saron 7 Key Buttons (Col 5 on MD) */}
          <div className="md:col-span-5 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-cyan-200/80 font-medium px-1">
              <span>High Saron (Metallophone Keys)</span>
              <span className="font-mono text-[9px] text-slate-400">Keys: 1 to 7</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {GAMELAN_PITCHES.map((p, idx) => {
                const isActive = activeStrike?.category === 'high' && activeStrike.noteIndex === p.index;
                return (
                  <button
                    key={`high-${p.index}`}
                    onClick={() => playInstrument('high', p.index)}
                    className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 border-white ring-2 ring-cyan-300 scale-105 shadow-lg'
                        : 'bg-gradient-to-b from-cyan-900/60 to-slate-900/80 hover:from-cyan-800 hover:to-slate-800 text-cyan-100 border-cyan-500/30 shadow-xs'
                    }`}
                    title={`High Saron Note ${p.index}: ${p.name} (${p.solfege}) [Key: ${HIGH_KEY_SHORTCUTS[idx]}]`}
                  >
                    <span className="text-[11px] font-bold leading-none">{p.index}</span>
                    <span className="text-[9px] opacity-75 font-mono leading-none mt-0.5">
                      {HIGH_KEY_SHORTCUTS[idx]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
