import { useRef, useEffect, useMemo, Suspense, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ZoomIn, ZoomOut, RotateCcw, Move,
} from "lucide-react";

interface ModelProps {
  url: string;
  userOffset: [number, number, number];
  userScale: number;
  onSceneReady?: (scene: THREE.Object3D) => void;
}

function findBoneByNames(skeleton: THREE.Bone[], names: string[]): THREE.Bone | null {
  for (const bone of skeleton) {
    const boneName = bone.name.toLowerCase();
    if (names.some((n) => boneName.includes(n))) return bone;
  }
  return null;
}

function getAllBones(object: THREE.Object3D): THREE.Bone[] {
  const bones: THREE.Bone[] = [];
  object.traverse((child) => {
    if ((child as THREE.Bone).isBone) bones.push(child as THREE.Bone);
  });
  return bones;
}

function getMorphTargets(object: THREE.Object3D) {
  const targets: { mesh: THREE.Mesh; index: number; name: string }[] = [];
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
        targets.push({ mesh, index, name });
      }
    }
  });
  return targets;
}

/** Compute a normalisation transform so any model fits within ~2.5 units, bottom at y=0 */
function computeNormalisation(object: THREE.Object3D) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);

  // Fallback: if bounding box is empty/degenerate, try computing from geometry directly
  if (box.isEmpty()) {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) {
        mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          box.expandByObject(mesh);
        }
      }
    });
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0.001 ? 2.5 / maxDim : 1;

  return {
    scale,
    offsetX: -center.x * scale,
    offsetY: -box.min.y * scale,
    offsetZ: -center.z * scale,
  };
}

function Model({ url, userOffset, userScale, onSceneReady }: ModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const headBone = useRef<THREE.Bone | null>(null);
  const jawBone = useRef<THREE.Bone | null>(null);
  const mouthMorphs = useRef<{ mesh: THREE.Mesh; index: number }[]>([]);
  const headInitialRot = useRef<THREE.Euler | null>(null);
  const jawInitialRot = useRef<THREE.Euler | null>(null);

  // Compute normalisation once per scene
  const norm = useMemo(() => computeNormalisation(scene), [scene]);

  // Report scene to parent for inspector
  useEffect(() => {
    onSceneReady?.(scene);
  }, [scene, onSceneReady]);

  // Find bones & morph targets once
  useEffect(() => {
    const bones = getAllBones(scene);
    const head = findBoneByNames(bones, ["head"]);
    const jaw = findBoneByNames(bones, ["jaw", "chin", "mouth"]);

    headBone.current = head;
    jawBone.current = jaw;
    headInitialRot.current = head ? head.rotation.clone() : null;
    jawInitialRot.current = jaw ? jaw.rotation.clone() : null;

    const morphs = getMorphTargets(scene);
    mouthMorphs.current = morphs
      .filter((m) => {
        const n = m.name.toLowerCase();
        return n.includes("mouth") || n.includes("jaw") || n.includes("open") || n.includes("aa") || n.includes("oh");
      })
      .map((m) => ({ mesh: m.mesh, index: m.index }));
  }, [scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isSpeaking = speechSynthesis.speaking;

    // Head bone animation
    if (headBone.current && headInitialRot.current) {
      const base = headInitialRot.current;
      if (isSpeaking) {
        headBone.current.rotation.x = base.x + Math.sin(t * 4) * 0.06;
        headBone.current.rotation.y = base.y + Math.sin(t * 2.5) * 0.08;
        headBone.current.rotation.z = base.z + Math.sin(t * 3.2) * 0.03;
      } else {
        headBone.current.rotation.x = base.x + Math.sin(t * 0.8) * 0.015;
        headBone.current.rotation.y = base.y + Math.sin(t * 0.5) * 0.01;
        headBone.current.rotation.z = base.z;
      }
    }

    // Jaw bone animation (lip sync)
    if (jawBone.current && jawInitialRot.current) {
      if (isSpeaking) {
        const jawOpen = (Math.sin(t * 12) * 0.5 + 0.5) * 0.15;
        jawBone.current.rotation.x = jawInitialRot.current.x + jawOpen;
      } else {
        jawBone.current.rotation.x = jawInitialRot.current.x;
      }
    }

    // Morph target lip sync
    for (const { mesh, index } of mouthMorphs.current) {
      if (mesh.morphTargetInfluences) {
        if (isSpeaking) {
          mesh.morphTargetInfluences[index] = Math.sin(t * 10 + index) * 0.3 + 0.35;
        } else {
          mesh.morphTargetInfluences[index] *= 0.9;
        }
      }
    }
  });

  // Final combined transform: userOffset + norm offset, userScale * norm scale
  const combinedScale = userScale * norm.scale;
  const posX = userOffset[0] + norm.offsetX * userScale;
  const posY = userOffset[1] + norm.offsetY * userScale;
  const posZ = userOffset[2] + norm.offsetZ * userScale;

  return (
    <group
      ref={groupRef}
      position={[posX, posY, posZ]}
      scale={[combinedScale, combinedScale, combinedScale]}
    >
      <primitive object={scene} />
    </group>
  );
}

function PlaceholderScene() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="hsl(185, 80%, 50%)"
        wireframe
        emissive="hsl(185, 80%, 30%)"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

interface ModelViewerProps {
  modelUrl: string | null;
  onSceneReady?: (scene: THREE.Object3D | null) => void;
}

function LoadingOverlay() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-64 space-y-3 text-center">
        <p className="text-sm font-medium text-foreground">Loading model…</p>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

export default function ModelViewer({ modelUrl, onSceneReady }: ModelViewerProps) {
  const [offset, setOffset] = useState<[number, number, number]>([0, 0, 0]);
  const [userScale, setUserScale] = useState(1);

  // Reset when model changes
  useEffect(() => {
    setOffset([0, 0, 0]);
    setUserScale(1);
    if (!modelUrl) onSceneReady?.(null);
  }, [modelUrl, onSceneReady]);

  const STEP = 0.15;
  const MIN_SCALE = 0.01;
  const MAX_SCALE = 50;

  const move = useCallback(
    (dx: number, dy: number, dz: number) =>
      setOffset((prev) => [prev[0] + dx, prev[1] + dy, prev[2] + dz]),
    [],
  );
  const scaleUp = useCallback(
    () => setUserScale((s) => Math.min(MAX_SCALE, s * 1.2)),
    [],
  );
  const scaleDown = useCallback(
    () => setUserScale((s) => Math.max(MIN_SCALE, s / 1.2)),
    [],
  );
  const reset = useCallback(() => {
    setOffset([0, 0, 0]);
    setUserScale(1);
  }, []);

  const btnClass =
    "flex items-center justify-center w-8 h-8 rounded-lg bg-background/70 border border-border/50 text-foreground/80 hover:bg-primary/20 hover:text-primary transition-colors active:scale-90";

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 1.2, 3.5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} color="#88ccff" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="hsl(185, 80%, 50%)" />

        <Suspense fallback={null}>
          {modelUrl ? (
            <Model url={modelUrl} key={modelUrl} userOffset={offset} userScale={userScale} onSceneReady={onSceneReady} />
          ) : (
            <PlaceholderScene />
          )}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={true}
          minDistance={0.05}
          maxDistance={100}
          target={[0, 0.8, 0]}
          zoomSpeed={1.2}
          panSpeed={0.8}
          enableDamping
          dampingFactor={0.12}
        />

        <gridHelper args={[20, 40, "#1a3a4a", "#0d1f2a"]} position={[0, 0, 0]} />
      </Canvas>

      <LoadingOverlay />

      {/* On-screen controls */}
      {modelUrl && (
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 select-none">
          {/* Move pad */}
          <div className="glass rounded-xl p-1.5 flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Move size={10} /> Move
            </span>
            <button className={btnClass} onClick={() => move(0, STEP, 0)} title="Move up">
              <ArrowUp size={14} />
            </button>
            <div className="flex gap-0.5">
              <button className={btnClass} onClick={() => move(-STEP, 0, 0)} title="Move left">
                <ArrowLeft size={14} />
              </button>
              <button className={btnClass} onClick={() => move(0, -STEP, 0)} title="Move down">
                <ArrowDown size={14} />
              </button>
              <button className={btnClass} onClick={() => move(STEP, 0, 0)} title="Move right">
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Scale controls */}
          <div className="glass rounded-xl p-1.5 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Scale ({userScale.toFixed(1)}×)
            </span>
            <div className="flex gap-0.5">
              <button className={btnClass} onClick={scaleDown} title="Scale down">
                <ZoomOut size={14} />
              </button>
              <button className={btnClass} onClick={scaleUp} title="Scale up">
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Reset */}
          <button
            className="glass rounded-xl px-3 py-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={reset}
            title="Reset position & scale"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
