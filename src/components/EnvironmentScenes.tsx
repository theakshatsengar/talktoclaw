import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars, Sky } from "@react-three/drei";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function Ground({
  color,
  size = 80,
  roughness = 0.8,
  metalness = 0,
}: {
  color: string;
  size?: number;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Studio                                                             */
/* ------------------------------------------------------------------ */

function StudioScene() {
  return (
    <group>
      <Ground color="#cccccc" roughness={0.2} metalness={0.05} />
      {/* Backdrop wall */}
      <mesh position={[0, 5, -10]} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-12, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#d5d5d5" roughness={0.5} />
      </mesh>
      <mesh position={[12, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#d5d5d5" roughness={0.5} />
      </mesh>
      {/* Softbox lights on tripod stands */}
      {[-3.5, 3.5].map((x, i) => (
        <group key={i} position={[x, 0, 4]}>
          {/* Stand pole */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 4, 8]} />
            <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Softbox panel */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[0.9, 1.1, 0.12]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sunset                                                             */
/* ------------------------------------------------------------------ */

function SunsetScene() {
  return (
    <group>
      <Ground color="#c4a46c" roughness={0.9} />
      <Sky
        sunPosition={[100, 10, -50]}
        rayleigh={2}
        turbidity={10}
        mieCoefficient={0.1}
        mieDirectionalG={0.8}
      />
      {/* Sand dunes */}
      {(
        [
          [-6, 0, -8, 3, 0.8, 2],
          [8, 0, -12, 4, 1, 3],
          [-10, 0, -15, 5, 0.6, 3],
          [12, 0, -6, 2.5, 0.7, 2],
          [0, 0, -20, 6, 1.2, 4],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b89050" roughness={0.95} />
        </mesh>
      ))}
      {/* Distant palm tree silhouettes */}
      {([-10, 14] as number[]).map((x, i) => (
        <group key={`palm${i}`} position={[x, 0, -12 - i * 4]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 5, 8]} />
            <meshStandardMaterial color="#3a2810" roughness={0.9} />
          </mesh>
          {[0, 1, 2, 3].map((j) => (
            <mesh
              key={j}
              position={[Math.cos(j * 1.6) * 0.8, 5.2, Math.sin(j * 1.6) * 0.8]}
              rotation={[0.4 * Math.cos(j * 1.6), j * 1.6, 0.4 * Math.sin(j * 1.6)]}
            >
              <planeGeometry args={[1.5, 0.3]} />
              <meshStandardMaterial color="#2a4a10" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Night                                                              */
/* ------------------------------------------------------------------ */

function NightScene() {
  return (
    <group>
      <Ground color="#0a0a15" roughness={0.7} />
      <Stars radius={80} depth={60} count={5000} factor={4} fade speed={1} />
      {/* Glowing moon */}
      <mesh position={[20, 30, -30]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color="#ffffdd"
          emissive="#ffffaa"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Dark tree silhouettes scattered around */}
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = 12 + (i % 3) * 3;
        const h = 3 + (i % 3);
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <mesh position={[0, h * 0.3, 0]}>
              <cylinderGeometry args={[0.08, 0.12, h * 0.6, 6]} />
              <meshStandardMaterial color="#080810" />
            </mesh>
            <mesh position={[0, h * 0.7, 0]}>
              <coneGeometry args={[1, h * 0.5, 6]} />
              <meshStandardMaterial color="#050510" />
            </mesh>
          </group>
        );
      })}
      {/* Fireflies / glowing particles */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`ff${i}`} position={[Math.sin(i * 2) * 5, 1 + i * 0.3, Math.cos(i * 2) * 5]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#aaff66" emissive="#aaff44" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Dawn                                                               */
/* ------------------------------------------------------------------ */

function DawnScene() {
  return (
    <group>
      <Ground color="#3a5a30" roughness={0.9} />
      <Sky sunPosition={[50, 5, 30]} rayleigh={3} turbidity={8} />
      {/* Rolling hills */}
      {(
        [
          [-15, -1, -20, 8, 2, 6],
          [20, -1, -25, 10, 2.5, 7],
          [0, -1, -30, 12, 3, 8],
          [-25, -1, -18, 6, 1.5, 5],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2a4a20" roughness={0.9} />
        </mesh>
      ))}
      {/* Morning mist layer */}
      <mesh position={[0, 0.4, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#ffeedd" transparent opacity={0.04} />
      </mesh>
      {/* Scattered small flowers */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 3 + (i % 4) * 2;
        const colors = ["#ff6688", "#ffaa44", "#ffdd55", "#ff88cc"];
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.05, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              emissive={colors[i % colors.length]}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Forest                                                             */
/* ------------------------------------------------------------------ */

function ForestScene() {
  const trees = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 30) * Math.PI * 2 + i * 0.3;
        const r = 5 + (i % 5) * 2.5 + Math.sin(i * 7) * 2;
        const h = 2.5 + (i % 3) * 1.5;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          height: h,
          canopyRadius: 0.6 + (i % 4) * 0.3,
          trunkColor: i % 3 === 0 ? "#4a2a10" : "#5c3a1e",
          canopyColor: i % 3 === 0 ? "#1a4a15" : i % 3 === 1 ? "#2d5a27" : "#1e5520",
        };
      }),
    [],
  );

  const rocks = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + 0.5;
        const r = 4 + i * 1.2;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          scale: 0.2 + (i % 3) * 0.15,
          rotY: i * 2.3,
        };
      }),
    [],
  );

  return (
    <group>
      <Ground color="#1a3010" roughness={0.95} />
      <Sky sunPosition={[50, 40, 30]} rayleigh={1} turbidity={3} />
      {/* Ground cover: moss / undergrowth */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 2 + i * 0.8;
        return (
          <mesh key={`m${i}`} position={[Math.cos(angle) * r, 0.01, Math.sin(angle) * r]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.3 + (i % 3) * 0.2, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#1a4010" : "#2a5515"} roughness={0.95} />
          </mesh>
        );
      })}
      {/* Trees */}
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.height * 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.1, t.height * 0.6, 6]} />
            <meshStandardMaterial color={t.trunkColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, t.height * 0.65, 0]}>
            <coneGeometry args={[t.canopyRadius, t.height * 0.5, 7]} />
            <meshStandardMaterial color={t.canopyColor} roughness={0.85} />
          </mesh>
        </group>
      ))}
      {/* Rocks on forest floor */}
      {rocks.map((r, i) => (
        <mesh
          key={`r${i}`}
          position={[r.x, r.scale * 0.3, r.z]}
          scale={r.scale}
          rotation={[0, r.rotY, 0]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4a4a3a" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Warehouse                                                          */
/* ------------------------------------------------------------------ */

function WarehouseScene() {
  return (
    <group>
      <Ground color="#555555" roughness={0.7} metalness={0.1} />
      {/* Walls */}
      <mesh position={[0, 5, -12]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
      </mesh>
      <mesh position={[-15, 5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>
      <mesh position={[15, 5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 12]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      {/* Stacked crates */}
      {(
        [
          [5, 0.6, -8],
          [7, 0.6, -9],
          [6, 1.8, -8.5],
          [-8, 0.75, -6],
          [-7, 0.75, -7],
          [-8, 2.0, -6.5],
          [10, 0.6, -4],
        ] as [number, number, number][]
      ).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#8a6a40" : "#7a5a30"} roughness={0.9} />
        </mesh>
      ))}
      {/* Hanging industrial lights */}
      {[-6, 0, 6].map((x, i) => (
        <group key={`l${i}`} position={[x, 8.5, 0]}>
          {/* Cable */}
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {/* Lamp shade */}
          <mesh>
            <cylinderGeometry args={[0.2, 0.4, 0.3, 12]} />
            <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
          </mesh>
          <pointLight intensity={0.6} color="#ffddaa" distance={15} />
        </group>
      ))}
      {/* Shelving units */}
      {[-11, 11].map((x, i) => (
        <group key={`shelf${i}`} position={[x, 0, -8]}>
          {[0, 1.5, 3, 4.5].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <boxGeometry args={[2, 0.08, 0.8]} />
              <meshStandardMaterial color="#666" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
          {/* Shelf uprights */}
          {[-0.9, 0.9].map((sx, k) => (
            <mesh key={`up${k}`} position={[sx, 2.5, 0]}>
              <boxGeometry args={[0.05, 5, 0.05]} />
              <meshStandardMaterial color="#555" metalness={0.5} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Arctic                                                             */
/* ------------------------------------------------------------------ */

function ArcticScene() {
  const iceFormations = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const r = 6 + (i % 4) * 3;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          height: 1 + (i % 3) * 1.5,
          width: 0.3 + (i % 2) * 0.3,
          rotY: i * 1.8,
          tilt: (i % 3 - 1) * 0.15,
        };
      }),
    [],
  );

  return (
    <group>
      <Ground color="#d8e8f0" roughness={0.15} metalness={0.3} size={100} />
      <Stars radius={80} depth={60} count={3000} factor={4} fade speed={1} />
      {/* Ice crystal formations */}
      {iceFormations.map((ice, i) => (
        <mesh
          key={i}
          position={[ice.x, ice.height / 2, ice.z]}
          rotation={[0, ice.rotY, ice.tilt]}
        >
          <boxGeometry args={[ice.width, ice.height, ice.width * 0.8]} />
          <meshStandardMaterial
            color="#a0d0e8"
            roughness={0.05}
            metalness={0.2}
            transparent
            opacity={0.75}
            emissive="#88bbdd"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
      {/* Snow mounds / drifts */}
      {(
        [
          [-5, 0, -7, 3, 0.5, 2],
          [8, 0, -10, 4, 0.7, 3],
          [-10, 0, 5, 2.5, 0.4, 2],
          [6, 0, 8, 3, 0.6, 2.5],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`s${i}`} position={[x, y, z]} scale={[sx, sy, sz]}>
          <sphereGeometry args={[1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e0eef5" roughness={0.4} />
        </mesh>
      ))}
      {/* Distant icy mountains */}
      {(
        [
          [-20, 0, -25, 5, 8, 4],
          [-10, 0, -30, 6, 10, 5],
          [15, 0, -28, 7, 9, 5],
          [25, 0, -22, 4, 6, 3],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`mt${i}`} position={[x, y, z]} scale={[sx, sy, sz]}>
          <coneGeometry args={[1, 2, 6]} />
          <meshStandardMaterial color="#c8dde8" roughness={0.3} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Lava                                                               */
/* ------------------------------------------------------------------ */

function LavaScene() {
  const lavaPoolsRef = useRef<(THREE.Mesh | null)[]>([]);

  const rocks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const r = 5 + (i % 3) * 3;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          scale: 0.5 + (i % 4) * 0.4,
          rotY: i * 2.1,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const mesh of lavaPoolsRef.current) {
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1.5 + Math.sin(t * 2 + Math.random() * 0.1) * 0.5;
      }
    }
  });

  return (
    <group>
      <Ground color="#1a0a05" roughness={0.95} />
      {/* Lava pools with pulsing glow */}
      {(
        [
          [-4, 0.01, -6, 1.2],
          [6, 0.01, -4, 1.5],
          [-2, 0.01, 5, 0.9],
          [8, 0.01, 8, 1.8],
          [-7, 0.01, 3, 1.0],
        ] as [number, number, number, number][]
      ).map(([x, y, z, radius], i) => (
        <mesh
          key={`lava${i}`}
          ref={(el) => { lavaPoolsRef.current[i] = el; }}
          position={[x, y, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[radius, 16]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* Dark volcanic rocks */}
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.scale * 0.4, r.z]}
          scale={r.scale}
          rotation={[0.2, r.rotY, 0.1]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Glowing cracks on ground */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={`crack${i}`}
          position={[Math.sin(i * 1.2) * 8, 0.005, Math.cos(i * 0.9) * 7]}
          rotation={[-Math.PI / 2, 0, i * 0.8]}
        >
          <planeGeometry args={[3 + i * 0.4, 0.06]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={3} />
        </mesh>
      ))}
      {/* Smoke wisps (simple transparent planes) */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`smoke${i}`} position={[-4 + i * 4, 2 + i * 0.5, -5]}>
          <planeGeometry args={[2, 3]} />
          <meshStandardMaterial color="#333" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Ocean                                                              */
/* ------------------------------------------------------------------ */

function OceanScene() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const t = clock.getElapsedTime();
      waterRef.current.position.y = Math.sin(t * 0.5) * 0.06 + 0.03;
      waterRef.current.rotation.z = Math.sin(t * 0.3) * 0.005;
    }
  });

  return (
    <group>
      {/* Sandy ocean floor */}
      <Ground color="#6a5a3a" roughness={0.9} />
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[80, 80, 32, 32]} />
        <meshStandardMaterial
          color="#1a6688"
          roughness={0.05}
          metalness={0.4}
          transparent
          opacity={0.65}
        />
      </mesh>
      <Sky sunPosition={[100, 30, 50]} rayleigh={2} turbidity={5} />
      {/* Distant wave bumps */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[i * 4 - 18, 0.06, -15 - (i % 3) * 4]}
          scale={[4, 0.12, 1.5]}
          rotation={[0, i * 0.15, 0]}
        >
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1a7799" roughness={0.1} metalness={0.2} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Rocks sticking out of water */}
      {(
        [
          [8, 0.3, -5, 0.6],
          [-6, 0.2, -8, 0.4],
          [12, 0.15, 3, 0.3],
        ] as [number, number, number, number][]
      ).map(([x, y, z, s], i) => (
        <mesh key={`rock${i}`} position={[x, y, z]} scale={s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5a5a4a" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Moon                                                               */
/* ------------------------------------------------------------------ */

function MoonScene() {
  const craters = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + i * 0.7;
        const r = 4 + (i % 4) * 3;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          radius: 0.5 + (i % 3) * 0.5,
        };
      }),
    [],
  );

  const rocks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const r = 3 + (i % 5) * 2.5;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          scale: 0.12 + (i % 3) * 0.12,
          rotY: i * 2.5,
        };
      }),
    [],
  );

  return (
    <group>
      {/* Grey lunar surface */}
      <Ground color="#888888" roughness={0.95} size={100} />
      <Stars radius={100} depth={60} count={8000} factor={5} fade speed={0.5} />
      {/* Earth in the sky */}
      <mesh position={[-30, 40, -50]}>
        <sphereGeometry args={[5, 32, 32]} />
        <meshStandardMaterial color="#2244aa" emissive="#1133aa" emissiveIntensity={0.3} />
      </mesh>
      {/* Craters - dark circles with raised rims */}
      {craters.map((c, i) => (
        <group key={i}>
          {/* Crater rim */}
          <mesh position={[c.x, 0.02, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[c.radius * 0.75, c.radius, 24]} />
            <meshStandardMaterial color="#999999" roughness={0.9} />
          </mesh>
          {/* Crater floor (darker) */}
          <mesh position={[c.x, -0.02, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[c.radius * 0.75, 24]} />
            <meshStandardMaterial color="#5a5a5a" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Scattered moon rocks */}
      {rocks.map((r, i) => (
        <mesh
          key={`r${i}`}
          position={[r.x, r.scale * 0.3, r.z]}
          scale={r.scale}
          rotation={[0.2, r.rotY, 0]}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#777777" roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Distant lunar mountains */}
      {(
        [
          [-25, 0, -30, 6, 5, 4],
          [20, 0, -35, 8, 7, 5],
          [0, 0, -40, 10, 4, 6],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`lm${i}`} position={[x, y, z]} scale={[sx, sy, sz]}>
          <coneGeometry args={[1, 2, 5]} />
          <meshStandardMaterial color="#777" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Mars                                                               */
/* ------------------------------------------------------------------ */

function MarsScene() {
  const rocks = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const r = 4 + (i % 5) * 2.5;
        return {
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r,
          scale: 0.25 + (i % 4) * 0.25,
          rotY: i * 1.9,
          color: i % 3 === 0 ? "#8b4513" : i % 3 === 1 ? "#a0522d" : "#7a3b10",
        };
      }),
    [],
  );

  const ridges = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: i * 8 - 20,
        z: -18 - i * 2,
        scaleX: 4 + (i % 3) * 2,
        scaleY: 2 + i * 0.8,
        scaleZ: 3 + (i % 2),
      })),
    [],
  );

  return (
    <group>
      {/* Red Martian soil */}
      <Ground color="#b5541a" roughness={0.95} />
      {/* Rusty red sky dome */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshStandardMaterial
          color="#cc6633"
          side={THREE.BackSide}
          emissive="#441100"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Rocky formations scattered around */}
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.scale * 0.4, r.z]}
          scale={r.scale}
          rotation={[0.15, r.rotY, 0.1]}
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={r.color} roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Distant ridges / mountains */}
      {ridges.map((ridge, i) => (
        <mesh
          key={`ridge${i}`}
          position={[ridge.x, 0, ridge.z]}
          scale={[ridge.scaleX, ridge.scaleY, ridge.scaleZ]}
        >
          <coneGeometry args={[1, 2, 6]} />
          <meshStandardMaterial color="#8a3a10" roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Dust devil hint: thin translucent cone */}
      <mesh position={[15, 3, -10]} rotation={[0, 0, 0.05]}>
        <coneGeometry args={[0.5, 8, 12, 1, true]} />
        <meshStandardMaterial color="#bb7744" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      {/* Large boulder */}
      <mesh position={[-3, 0.8, -6]} scale={1.2} rotation={[0.3, 0.8, 0.1]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#7a3a15" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Nobita's Room (Doraemon)                                           */
/* ------------------------------------------------------------------ */

function NobitaRoomScene() {
  // Room dimensions: ~5m wide, ~3m tall, ~5m deep
  const W = 5;
  const H = 3;
  const D = 5;

  return (
    <group position={[0, 0, 0]}>
      {/* ── Floor: warm tatami-style wooden planks ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#c8a870" roughness={0.85} />
      </mesh>
      {/* Tatami mat lines */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={`fl${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -D / 2 + 0.5 + i * 1]}>
          <planeGeometry args={[W - 0.1, 0.02]} />
          <meshStandardMaterial color="#a08850" />
        </mesh>
      ))}

      {/* ── Walls ── */}
      {/* Back wall (warm cream) */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.7} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color="#f0dfc0" roughness={0.7} />
      </mesh>
      {/* Right wall — window wall */}
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color="#f0dfc0" roughness={0.7} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* ── Ceiling light (round Japanese-style) ── */}
      <group position={[0, H - 0.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffee" emissiveIntensity={2} />
        </mesh>
        <pointLight intensity={0.8} color="#fffde0" distance={8} />
      </group>

      {/* ── Closet (Doraemon's closet!) — back-left ── */}
      <group position={[-W / 2 + 0.5, 0, -D / 2 + 0.3]}>
        {/* Main closet body */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.9, 2.2, 0.55]} />
          <meshStandardMaterial color="#d4a460" roughness={0.8} />
        </mesh>
        {/* Upper door */}
        <mesh position={[0, 1.65, 0.281]}>
          <boxGeometry args={[0.85, 1.0, 0.02]} />
          <meshStandardMaterial color="#c49450" roughness={0.7} />
        </mesh>
        {/* Lower door */}
        <mesh position={[0, 0.55, 0.281]}>
          <boxGeometry args={[0.85, 1.0, 0.02]} />
          <meshStandardMaterial color="#c49450" roughness={0.7} />
        </mesh>
        {/* Door handles */}
        {[0.55, 1.65].map((y, i) => (
          <mesh key={`dh${i}`} position={[0.15, y, 0.3]}>
            <boxGeometry args={[0.08, 0.04, 0.03]} />
            <meshStandardMaterial color="#a0843c" metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {/* Divider line */}
        <mesh position={[0, 1.1, 0.29]}>
          <boxGeometry args={[0.86, 0.03, 0.01]} />
          <meshStandardMaterial color="#a07a3a" />
        </mesh>
      </group>

      {/* ── Study desk — against back wall, center-right ── */}
      <group position={[0.8, 0, -D / 2 + 0.4]}>
        {/* Desktop surface */}
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[1.1, 0.04, 0.55]} />
          <meshStandardMaterial color="#b8843c" roughness={0.6} />
        </mesh>
        {/* Legs */}
        {(
          [[-0.5, 0.35, -0.22], [0.5, 0.35, -0.22], [-0.5, 0.35, 0.22], [0.5, 0.35, 0.22]] as [number, number, number][]
        ).map(([lx, ly, lz], i) => (
          <mesh key={`dl${i}`} position={[lx, ly, lz]}>
            <boxGeometry args={[0.04, 0.7, 0.04]} />
            <meshStandardMaterial color="#a07030" roughness={0.7} />
          </mesh>
        ))}
        {/* Drawer panel under desk */}
        <mesh position={[0.25, 0.45, 0.26]}>
          <boxGeometry args={[0.5, 0.5, 0.02]} />
          <meshStandardMaterial color="#a87a38" roughness={0.7} />
        </mesh>
        {/* Drawer handles */}
        {[0.55, 0.35].map((y, i) => (
          <mesh key={`drh${i}`} position={[0.25, y, 0.275]}>
            <boxGeometry args={[0.12, 0.025, 0.02]} />
            <meshStandardMaterial color="#907030" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}

        {/* ── Desk lamp ── */}
        <group position={[0.4, 0.74, -0.1]}>
          {/* Base */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.04, 12]} />
            <meshStandardMaterial color="#228844" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 0.17, 0]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
            <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Shade */}
          <mesh position={[0.03, 0.32, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.07, 0.06, 12, 1, true]} />
            <meshStandardMaterial color="#228844" roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0.03, 0.28, 0]} intensity={0.3} color="#ffffcc" distance={2} />
        </group>

        {/* ── Books on desk ── */}
        {[
          { x: -0.35, color: "#cc3333", w: 0.04, h: 0.18, d: 0.13 },
          { x: -0.30, color: "#3366cc", w: 0.03, h: 0.17, d: 0.12 },
          { x: -0.26, color: "#33aa55", w: 0.035, h: 0.19, d: 0.13 },
          { x: -0.22, color: "#dd8833", w: 0.03, h: 0.16, d: 0.11 },
        ].map((b, i) => (
          <mesh key={`db${i}`} position={[b.x, 0.74 + b.h / 2, -0.12]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.8} />
          </mesh>
        ))}

        {/* ── Open notebook on desk ── */}
        <mesh position={[0, 0.745, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshStandardMaterial color="#f8f4e8" roughness={0.9} />
        </mesh>
        {/* Pencil */}
        <mesh position={[0.12, 0.76, 0.05]} rotation={[0, 0, Math.PI / 2 - 0.2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.16, 6]} />
          <meshStandardMaterial color="#f0d040" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Chair — pushed slightly away from desk ── */}
      <group position={[0.8, 0, -D / 2 + 1.0]}>
        {/* Seat */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.38]} />
          <meshStandardMaterial color="#cc4444" roughness={0.7} />
        </mesh>
        {/* Seat cushion */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.36, 0.03, 0.34]} />
          <meshStandardMaterial color="#dd5555" roughness={0.85} />
        </mesh>
        {/* Chair legs */}
        {(
          [[-0.17, 0.2, -0.16], [0.17, 0.2, -0.16], [-0.17, 0.2, 0.16], [0.17, 0.2, 0.16]] as [number, number, number][]
        ).map(([cx, cy, cz], i) => (
          <mesh key={`cl${i}`} position={[cx, cy, cz]}>
            <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
            <meshStandardMaterial color="#777" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        {/* Back rest */}
        <mesh position={[0, 0.72, -0.17]}>
          <boxGeometry args={[0.38, 0.55, 0.03]} />
          <meshStandardMaterial color="#cc4444" roughness={0.7} />
        </mesh>
        {/* Backrest uprights */}
        {[-0.17, 0.17].map((cx, i) => (
          <mesh key={`bu${i}`} position={[cx, 0.58, -0.17]}>
            <cylinderGeometry args={[0.015, 0.015, 0.32, 6]} />
            <meshStandardMaterial color="#777" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── Bookshelf — left wall ── */}
      <group position={[-W / 2 + 0.25, 0, 0.5]}>
        {/* Shelf frame */}
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.4, 1.8, 0.3]} />
          <meshStandardMaterial color="#b87a3a" roughness={0.75} />
        </mesh>
        {/* Shelves */}
        {[0.3, 0.7, 1.1, 1.5].map((y, i) => (
          <mesh key={`sh${i}`} position={[0, y, 0]}>
            <boxGeometry args={[0.38, 0.025, 0.28]} />
            <meshStandardMaterial color="#a06a30" roughness={0.7} />
          </mesh>
        ))}
        {/* Books on shelves */}
        {[
          { y: 0.45, colors: ["#cc2233", "#2255cc", "#22aa44", "#cc8822", "#8833aa", "#dd5533"] },
          { y: 0.85, colors: ["#3366aa", "#aa3355", "#44bb44", "#dd9922", "#6644bb"] },
          { y: 1.25, colors: ["#cc4455", "#3388cc", "#55aa33", "#bbaa22"] },
        ].map(({ y, colors }, row) => (
          <group key={`br${row}`}>
            {colors.map((c, i) => (
              <mesh
                key={`b${row}_${i}`}
                position={[-0.12 + i * 0.05, y, 0]}
              >
                <boxGeometry args={[0.03, 0.17 + (i % 3) * 0.02, 0.11]} />
                <meshStandardMaterial color={c} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ── Window on right wall ── */}
      <group position={[W / 2 - 0.01, 1.5, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Window frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 1.0, 0.06]} />
          <meshStandardMaterial color="#e0d0b0" roughness={0.6} />
        </mesh>
        {/* Glass panes */}
        <mesh position={[-0.28, 0.22, 0.02]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.35} roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[0.28, 0.22, 0.02]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.35} roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[-0.28, -0.25, 0.02]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.35} roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[0.28, -0.25, 0.02]}>
          <planeGeometry args={[0.5, 0.4]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.35} roughness={0.05} metalness={0.1} />
        </mesh>
        {/* Cross bar dividers */}
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[1.15, 0.035, 0.02]} />
          <meshStandardMaterial color="#c8b898" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.035, 0.95, 0.02]} />
          <meshStandardMaterial color="#c8b898" roughness={0.6} />
        </mesh>

        {/* ── Curtains ── */}
        {/* Left curtain */}
        <mesh position={[-0.52, 0, 0.04]}>
          <boxGeometry args={[0.2, 1.0, 0.02]} />
          <meshStandardMaterial color="#ffaa55" roughness={0.85} />
        </mesh>
        {/* Right curtain */}
        <mesh position={[0.52, 0, 0.04]}>
          <boxGeometry args={[0.2, 1.0, 0.02]} />
          <meshStandardMaterial color="#ffaa55" roughness={0.85} />
        </mesh>
        {/* Curtain rod */}
        <mesh position={[0, 0.55, 0.04]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
          <meshStandardMaterial color="#bb9955" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Sunlight from window */}
        <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#ffffdd" distance={5} />
      </group>

      {/* ── Bed / futon — right side, along wall ── */}
      <group position={[W / 2 - 0.75, 0, 1.0]}>
        {/* Futon mattress */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.0, 0.15, 1.8]} />
          <meshStandardMaterial color="#4488cc" roughness={0.85} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.2, -0.7]} scale={[1, 0.6, 1]}>
          <boxGeometry args={[0.55, 0.12, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Blanket / comforter */}
        <mesh position={[0, 0.2, 0.15]}>
          <boxGeometry args={[0.95, 0.06, 1.2]} />
          <meshStandardMaterial color="#ee6633" roughness={0.85} />
        </mesh>
        {/* Blanket fold */}
        <mesh position={[0, 0.24, -0.3]}>
          <boxGeometry args={[0.95, 0.03, 0.25]} />
          <meshStandardMaterial color="#dd5522" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Wall clock — back wall ── */}
      <group position={[0, 2.3, -D / 2 + 0.02]}>
        {/* Clock face */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Clock rim */}
        <mesh>
          <torusGeometry args={[0.15, 0.012, 8, 24]} />
          <meshStandardMaterial color="#886633" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Hour hand */}
        <mesh position={[0, 0.03, 0.013]} rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.008, 0.08, 0.005]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* Minute hand */}
        <mesh position={[0, 0.04, 0.013]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.005, 0.11, 0.004]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>

      {/* ── Small rug / carpet in center ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshStandardMaterial color="#558844" roughness={0.9} />
      </mesh>
      {/* Rug border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[1.55, 1.15]} />
        <meshStandardMaterial color="#cc8833" roughness={0.85} />
      </mesh>

      {/* ── Low table (chabudai) in center ── */}
      <group position={[0, 0, 0.1]}>
        {/* Tabletop */}
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 24]} />
          <meshStandardMaterial color="#b07030" roughness={0.6} />
        </mesh>
        {/* Legs */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`tl${i}`}
            position={[
              Math.cos((i * Math.PI) / 2 + Math.PI / 4) * 0.3,
              0.155,
              Math.sin((i * Math.PI) / 2 + Math.PI / 4) * 0.3,
            ]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#8a5528" roughness={0.7} />
          </mesh>
        ))}
        {/* Manga on table */}
        <mesh position={[-0.1, 0.35, 0.05]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[0.13, 0.18]} />
          <meshStandardMaterial color="#ff6644" roughness={0.85} />
        </mesh>
        <mesh position={[-0.05, 0.35, 0.08]} rotation={[-Math.PI / 2, 0, -0.1]}>
          <planeGeometry args={[0.13, 0.18]} />
          <meshStandardMaterial color="#4488dd" roughness={0.85} />
        </mesh>
      </group>

      {/* ── Sliding door (fusuma) hint — back-right ── */}
      <group position={[W / 2 - 0.02, 0, -D / 2 + 0.02]}>
        <mesh position={[0, 1.05, 0.7]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[1.3, 2.1, 0.04]} />
          <meshStandardMaterial color="#e8dcc4" roughness={0.8} />
        </mesh>
        {/* Handle */}
        <mesh position={[-0.03, 1.0, 0.55]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[0.06, 0.12, 0.025]} />
          <meshStandardMaterial color="#997744" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Baseboard trim along walls ── */}
      <mesh position={[0, 0.04, -D / 2 + 0.02]}>
        <boxGeometry args={[W, 0.08, 0.02]} />
        <meshStandardMaterial color="#a08050" roughness={0.7} />
      </mesh>
      <mesh position={[-W / 2 + 0.02, 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D, 0.08, 0.02]} />
        <meshStandardMaterial color="#a08050" roughness={0.7} />
      </mesh>
      <mesh position={[W / 2 - 0.02, 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[D, 0.08, 0.02]} />
        <meshStandardMaterial color="#a08050" roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Dispatcher                                                         */
/* ------------------------------------------------------------------ */

export default function EnvironmentScene({ envKey }: { envKey: string }) {
  switch (envKey) {
    case "studio":
      return <StudioScene />;
    case "sunset":
      return <SunsetScene />;
    case "night":
      return <NightScene />;
    case "dawn":
      return <DawnScene />;
    case "forest":
      return <ForestScene />;
    case "warehouse":
      return <WarehouseScene />;
    case "arctic":
      return <ArcticScene />;
    case "lava":
      return <LavaScene />;
    case "ocean":
      return <OceanScene />;
    case "moon":
      return <MoonScene />;
    case "mars":
      return <MarsScene />;
    case "room":
      return <NobitaRoomScene />;
    default:
      return null;
  }
}
