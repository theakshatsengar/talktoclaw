import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Progress } from "@/components/ui/progress";

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const baseRotation = useRef(0);

  useEffect(() => {
    // Center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;

    scene.position.sub(center);
    scene.scale.setScalar(scale);
    scene.position.y -= (box.min.y * scale);
  }, [scene]);

  useFrame(() => {
    if (!modelRef.current) return;

    if (speechSynthesis.speaking) {
      // Head nod / sway while speaking
      baseRotation.current += 0.005;
      modelRef.current.rotation.y = Math.sin(baseRotation.current * 3) * 0.1;
      modelRef.current.rotation.x = Math.sin(baseRotation.current * 5) * 0.03;
    } else {
      // Gentle idle sway
      baseRotation.current += 0.002;
      modelRef.current.rotation.y = Math.sin(baseRotation.current) * 0.02;
      modelRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={modelRef}>
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
        camera={{ position: [0, 1, 4], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#88ccff" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="hsl(185, 80%, 50%)" />

        <Suspense fallback={null}>
          {modelUrl ? (
            <Model url={modelUrl} />
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

        {/* Grid floor */}
        <gridHelper args={[20, 40, "#1a3a4a", "#0d1f2a"]} position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
