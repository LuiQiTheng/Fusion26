import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface BuildingModelViewerProps {
  modelUrl: string;
  className?: string;
}

export const BuildingModelViewer: React.FC<BuildingModelViewerProps> = ({
  modelUrl,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;
    setLoading(true);
    setLoadProgress(0);

    const isFood =
      modelUrl.toLowerCase().includes('kuih-keria') ||
      modelUrl.toLowerCase().includes('kuihkeria') ||
      modelUrl.toLowerCase().includes('kari-debal') ||
      modelUrl.toLowerCase().includes('kari');

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera setup: for food items, increase Y axis value (elevated angle) so the dish is clearly visible
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const camY = isFood ? 2.3 : 1.1;
    const camZ = isFood ? 5.2 : 5.8;
    camera.position.set(0, camY, camZ);
    camera.lookAt(0, 0, 0);

    // 3. Renderer with transparent background to let the modal's white backdrop show through
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0); // Transparent canvas
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // 4. OrbitControls: completely disable user rotation, panning, and zooming
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff8ee, 2.5);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd5eaff, 1.2);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334433, 1.0);
    scene.add(hemiLight);

    // 6. Model Group Container: 0 angle
    const modelGroup = new THREE.Group();
    modelGroup.rotation.set(0, 0, 0); // 0 angle on all axes
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 7. Load GLB Model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;

        const model = gltf.scene;

        // Traverse all meshes to guarantee 100% opacity (no transparency)
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
                mat.needsUpdate = true;
              });
            }
          }
        });

        // Center model geometry at (0, 0, 0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Normalize scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.4 / (maxDim || 1);
        model.scale.setScalar(targetScale);

        modelGroup.add(model);

        // Circular display pedestal (solid opaque, dynamically sized to model footprint)
        const halfX = (size.x * 0.5) * targetScale;
        const halfZ = (size.z * 0.5) * targetScale;
        const footprintRadius = Math.sqrt(halfX * halfX + halfZ * halfZ);
        const pedestalRadius = Math.max(1.45, footprintRadius * 1.08);

        const pedestalGeo = new THREE.CylinderGeometry(pedestalRadius, pedestalRadius + 0.05, 0.12, 64);
        const pedestalMat = new THREE.MeshStandardMaterial({
          color: 0x24322e,
          metalness: 0.85,
          roughness: 0.25,
          transparent: false,
          opacity: 1.0,
        });
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        const buildingBottom = (-size.y * 0.5) * targetScale;
        pedestal.position.y = buildingBottom - 0.06;
        modelGroup.add(pedestal);

        // Solid accent ring on the pedestal
        const ringGeo = new THREE.RingGeometry(pedestalRadius * 0.95, pedestalRadius * 1.0, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: false,
          opacity: 1.0,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = buildingBottom + 0.002;
        modelGroup.add(ring);

        // Ensure 0 angle along all axes initially
        modelGroup.rotation.set(0, 0, 0);

        setLoading(false);
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else if (xhr.loaded > 0) {
          const approx = Math.min(95, Math.round((xhr.loaded / (20 * 1024 * 1024)) * 100));
          setLoadProgress(approx);
        }
      },
      (err) => {
        if (isDisposed) return;
        console.error('Failed to load 3D GLB model:', err);
        setLoading(false);
      }
    );

    // 8. Animation loop:
    // For Kuih Keria and Kari Debal: increase Y-axis value to rotate anticlockwise
    // For buildings: rotate clockwise
    const rotateSpeed = 0.0075; // Smooth automatic rotation matching speed 1.5

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroupRef.current) {
        if (isFood) {
          // Increase Y axis value to rotate anticlockwise:
          modelGroupRef.current.rotation.y += rotateSpeed;
        } else {
          // Rotate clockwise for buildings:
          modelGroupRef.current.rotation.y -= rotateSpeed;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. ResizeObserver
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

    // 10. Cleanup on unmount
    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
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

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return (
    <div className={`relative flex items-center justify-center bg-transparent select-none pointer-events-none ${className}`}>
      {/* WebGL Canvas on transparent background - locked so user cannot move or rotate */}
      <div ref={mountRef} className="w-full h-full select-none pointer-events-none cursor-default bg-transparent" />

      {/* Elegant loading indicator matching white background */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs pointer-events-none">
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
