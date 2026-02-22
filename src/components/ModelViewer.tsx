import { useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Progress } from "@/components/ui/progress";

interface ModelProps {
  url: string;
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

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const modelRef = useRef<THREE.Group>(null);
  const baseRotation = useRef(0);
  const headBone = useRef<THREE.Bone | null>(null);
  const jawBone = useRef<THREE.Bone | null>(null);
  const mouthMorphs = useRef<{ mesh: THREE.Mesh; index: number }[]>([]);
  const headInitialRot = useRef<THREE.Euler | null>(null);
  const jawInitialRot = useRef<THREE.Euler | null>(null);

  useEffect(() => {
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;

    clonedScene.position.copy(center).multiplyScalar(-1);
    clonedScene.scale.setScalar(scale);
    clonedScene.position.y -= box.min.y * scale;

    // Find head and jaw bones
    const bones = getAllBones(clonedScene);
    const head = findBoneByNames(bones, ["head"]);
    const jaw = findBoneByNames(bones, ["jaw", "chin", "mouth"]);

    headBone.current = head;
    jawBone.current = jaw;
    headInitialRot.current = head ? head.rotation.clone() : null;
    jawInitialRot.current = jaw ? jaw.rotation.clone() : null;

    // Find mouth-related morph targets for lip sync
    const morphs = getMorphTargets(clonedScene);
    mouthMorphs.current = morphs
      .filter((m) => {
        const n = m.name.toLowerCase();
        return n.includes("mouth") || n.includes("jaw") || n.includes("open") || n.includes("aa") || n.includes("oh");
      })
      .map((m) => ({ mesh: m.mesh, index: m.index }));
  }, [clonedScene]);

  useFrame(({ clock }) => {
    if (!modelRef.current) return;
    const t = clock.getElapsedTime();
    const isSpeaking = speechSynthesis.speaking;

    // Head animation
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
    } else {
      // Fallback: rotate whole model group
      if (isSpeaking) {
        baseRotation.current += 0.008;
        modelRef.current.rotation.y = Math.sin(baseRotation.current * 3) * 0.1;
        modelRef.current.rotation.x = Math.sin(baseRotation.current * 5) * 0.04;
      } else {
        baseRotation.current += 0.002;
        modelRef.current.rotation.y = Math.sin(baseRotation.current) * 0.02;
        modelRef.current.rotation.x = 0;
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
    if (mouthMorphs.current.length > 0) {
      for (const { mesh, index } of mouthMorphs.current) {
        if (mesh.morphTargetInfluences) {
          if (isSpeaking) {
            mesh.morphTargetInfluences[index] =
              Math.sin(t * 10 + index) * 0.3 + 0.35;
          } else {
            mesh.morphTargetInfluences[index] *= 0.9; // smooth decay
          }
        }
      }
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={clonedScene} />
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

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
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
            <Model url={modelUrl} key={modelUrl} />
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
          enablePan={false}
          minDistance={1.5}
          maxDistance={8}
          target={[0, 0.8, 0]}
        />

        <gridHelper args={[20, 40, "#1a3a4a", "#0d1f2a"]} position={[0, 0, 0]} />
      </Canvas>
      <LoadingOverlay />
    </div>
  );
}
