import { useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Box,
  Paintbrush,
  Bone,
  Layers,
  Image,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
  Settings2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MeshInfo {
  name: string;
  uuid: string;
  mesh: THREE.Mesh;
  vertexCount: number;
  faceCount: number;
  visible: boolean;
  wireframe: boolean;
}

interface MaterialInfo {
  name: string;
  uuid: string;
  material: THREE.Material;
  color: string | null;
  emissive: string | null;
  metalness: number | null;
  roughness: number | null;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  side: THREE.Side;
}

interface BoneInfo {
  name: string;
  bone: THREE.Bone;
  depth: number;
  children: BoneInfo[];
}

interface MorphInfo {
  meshName: string;
  name: string;
  mesh: THREE.Mesh;
  index: number;
  value: number;
}

interface TextureInfo {
  name: string;
  slot: string;
  materialName: string;
  texture: THREE.Texture;
  width: number;
  height: number;
}

interface ModelInspectorProps {
  scene: THREE.Object3D | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function colorToHex(c: THREE.Color): string {
  return "#" + c.getHexString();
}

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function collectMeshes(root: THREE.Object3D): MeshInfo[] {
  const meshes: MeshInfo[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      const geo = mesh.geometry;
      meshes.push({
        name: mesh.name || `Mesh_${meshes.length}`,
        uuid: mesh.uuid,
        mesh,
        vertexCount: geo.attributes.position?.count ?? 0,
        faceCount: geo.index ? geo.index.count / 3 : (geo.attributes.position?.count ?? 0) / 3,
        visible: mesh.visible,
        wireframe: ((mesh.material as THREE.MeshStandardMaterial).wireframe) ?? false,
      });
    }
  });
  return meshes;
}

function collectMaterials(root: THREE.Object3D): MaterialInfo[] {
  const seen = new Set<string>();
  const mats: MaterialInfo[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (seen.has(mat.uuid)) continue;
      seen.add(mat.uuid);
      const std = mat as THREE.MeshStandardMaterial;
      mats.push({
        name: mat.name || `Material_${mats.length}`,
        uuid: mat.uuid,
        material: mat,
        color: std.color ? colorToHex(std.color) : null,
        emissive: std.emissive ? colorToHex(std.emissive) : null,
        metalness: std.metalness ?? null,
        roughness: std.roughness ?? null,
        opacity: mat.opacity,
        transparent: mat.transparent,
        wireframe: std.wireframe ?? false,
        side: mat.side,
      });
    }
  });
  return mats;
}

function buildBoneTree(bone: THREE.Bone, depth: number): BoneInfo {
  const children: BoneInfo[] = [];
  for (const child of bone.children) {
    if ((child as THREE.Bone).isBone) {
      children.push(buildBoneTree(child as THREE.Bone, depth + 1));
    }
  }
  return { name: bone.name || `Bone_${depth}`, bone, depth, children };
}

function collectBones(root: THREE.Object3D): BoneInfo[] {
  const rootBones: BoneInfo[] = [];
  root.traverse((child) => {
    const bone = child as THREE.Bone;
    if (bone.isBone && (!(bone.parent as THREE.Bone)?.isBone)) {
      rootBones.push(buildBoneTree(bone, 0));
    }
  });
  return rootBones;
}

function collectMorphTargets(root: THREE.Object3D): MorphInfo[] {
  const morphs: MorphInfo[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
        morphs.push({
          meshName: mesh.name || "Mesh",
          name,
          mesh,
          index,
          value: mesh.morphTargetInfluences[index] ?? 0,
        });
      }
    }
  });
  return morphs;
}

const TEX_SLOTS = [
  "map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap",
  "aoMap", "bumpMap", "displacementMap", "alphaMap", "envMap",
  "lightMap",
] as const;

function collectTextures(root: THREE.Object3D): TextureInfo[] {
  const seen = new Set<string>();
  const textures: TextureInfo[] = [];
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      for (const slot of TEX_SLOTS) {
        const tex = (mat as unknown as Record<string, THREE.Texture | null>)[slot];
        if (tex && tex.isTexture && !seen.has(tex.uuid)) {
          seen.add(tex.uuid);
          const img = tex.image;
          textures.push({
            name: tex.name || `${slot}`,
            slot,
            materialName: mat.name || "Material",
            texture: tex,
            width: img?.width ?? 0,
            height: img?.height ?? 0,
          });
        }
      }
    }
  });
  return textures;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function BoneNode({ info, onSelect }: { info: BoneInfo; onSelect: (b: THREE.Bone) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = info.children.length > 0;

  return (
    <div className="ml-2">
      <button
        className="flex items-center gap-1 text-xs py-0.5 hover:text-primary transition-colors w-full text-left"
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(info.bone);
        }}
      >
        {hasChildren ? (
          <ChevronRight
            size={10}
            className={`transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
          />
        ) : (
          <span className="w-[10px]" />
        )}
        <Bone size={10} className="text-muted-foreground flex-shrink-0" />
        <span className="truncate">{info.name}</span>
      </button>
      {expanded &&
        info.children.map((child, i) => (
          <BoneNode key={i} info={child} onSelect={onSelect} />
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main inspector                                                     */
/* ------------------------------------------------------------------ */

export default function ModelInspector({ scene }: ModelInspectorProps) {
  const [meshes, setMeshes] = useState<MeshInfo[]>([]);
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [bones, setBones] = useState<BoneInfo[]>([]);
  const [morphs, setMorphs] = useState<MorphInfo[]>([]);
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [selectedBone, setSelectedBone] = useState<THREE.Bone | null>(null);
  const [, forceUpdate] = useState(0);

  // Scan the scene
  useEffect(() => {
    if (!scene) {
      setMeshes([]);
      setMaterials([]);
      setBones([]);
      setMorphs([]);
      setTextures([]);
      return;
    }
    setMeshes(collectMeshes(scene));
    setMaterials(collectMaterials(scene));
    setBones(collectBones(scene));
    setMorphs(collectMorphTargets(scene));
    setTextures(collectTextures(scene));
  }, [scene]);

  const refresh = useCallback(() => {
    if (!scene) return;
    setMeshes(collectMeshes(scene));
    setMaterials(collectMaterials(scene));
    setMorphs(collectMorphTargets(scene));
    forceUpdate((n) => n + 1);
  }, [scene]);

  /* — Mesh handlers — */
  const toggleMeshVisibility = (uuid: string) => {
    const info = meshes.find((m) => m.uuid === uuid);
    if (!info) return;
    info.mesh.visible = !info.mesh.visible;
    refresh();
  };

  const toggleMeshWireframe = (uuid: string) => {
    const info = meshes.find((m) => m.uuid === uuid);
    if (!info) return;
    const mats = Array.isArray(info.mesh.material) ? info.mesh.material : [info.mesh.material];
    for (const mat of mats) {
      (mat as THREE.MeshStandardMaterial).wireframe = !(mat as THREE.MeshStandardMaterial).wireframe;
    }
    refresh();
  };

  /* — Material handlers — */
  const setMaterialColor = (uuid: string, hex: string) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    (info.material as THREE.MeshStandardMaterial).color = hexToColor(hex);
    (info.material as THREE.MeshStandardMaterial).needsUpdate = true;
    refresh();
  };

  const setMaterialEmissive = (uuid: string, hex: string) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    (info.material as THREE.MeshStandardMaterial).emissive = hexToColor(hex);
    (info.material as THREE.MeshStandardMaterial).needsUpdate = true;
    refresh();
  };

  const setMaterialMetalness = (uuid: string, val: number) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    (info.material as THREE.MeshStandardMaterial).metalness = val;
    (info.material as THREE.MeshStandardMaterial).needsUpdate = true;
    refresh();
  };

  const setMaterialRoughness = (uuid: string, val: number) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    (info.material as THREE.MeshStandardMaterial).roughness = val;
    (info.material as THREE.MeshStandardMaterial).needsUpdate = true;
    refresh();
  };

  const setMaterialOpacity = (uuid: string, val: number) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    info.material.opacity = val;
    info.material.transparent = val < 1;
    info.material.needsUpdate = true;
    refresh();
  };

  const toggleMaterialWireframe = (uuid: string) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    (info.material as THREE.MeshStandardMaterial).wireframe =
      !(info.material as THREE.MeshStandardMaterial).wireframe;
    info.material.needsUpdate = true;
    refresh();
  };

  const setMaterialSide = (uuid: string, side: THREE.Side) => {
    const info = materials.find((m) => m.uuid === uuid);
    if (!info) return;
    info.material.side = side;
    info.material.needsUpdate = true;
    refresh();
  };

  /* — Morph handler — */
  const setMorphValue = (meshUuid: string, index: number, value: number) => {
    // find mesh by traversing
    if (!scene) return;
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetInfluences) {
        // match by checking dictionary
        if (mesh.morphTargetDictionary) {
          for (const [, idx] of Object.entries(mesh.morphTargetDictionary)) {
            if (idx === index && mesh.uuid === meshUuid) {
              mesh.morphTargetInfluences[index] = value;
            }
          }
        }
      }
    });
    setMorphs((prev) =>
      prev.map((m) =>
        m.mesh.uuid === meshUuid && m.index === index ? { ...m, value } : m,
      ),
    );
  };

  if (!scene) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
        <p>Load a model to inspect its properties</p>
      </div>
    );
  }

  // Summary stats
  const totalVerts = meshes.reduce((s, m) => s + m.vertexCount, 0);
  const totalFaces = meshes.reduce((s, m) => s + m.faceCount, 0);
  const totalBones = (() => {
    let count = 0;
    const countBones = (list: BoneInfo[]) => {
      for (const b of list) { count++; countBones(b.children); }
    };
    countBones(bones);
    return count;
  })();

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
          <Settings2 size={12} /> Model Inspector
        </h3>

        <Accordion type="multiple" defaultValue={["overview"]} className="space-y-0">
          {/* ─── Overview ─── */}
          <AccordionItem value="overview" className="border-border/30">
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Info size={12} className="text-primary" /> Overview
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-xs space-y-1 pb-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                <span>Meshes</span><span className="text-foreground font-mono">{meshes.length}</span>
                <span>Materials</span><span className="text-foreground font-mono">{materials.length}</span>
                <span>Textures</span><span className="text-foreground font-mono">{textures.length}</span>
                <span>Bones</span><span className="text-foreground font-mono">{totalBones}</span>
                <span>Morph Targets</span><span className="text-foreground font-mono">{morphs.length}</span>
                <span>Vertices</span><span className="text-foreground font-mono">{totalVerts.toLocaleString()}</span>
                <span>Faces</span><span className="text-foreground font-mono">{totalFaces.toLocaleString()}</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Meshes ─── */}
          <AccordionItem value="meshes" className="border-border/30">
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Box size={12} className="text-primary" /> Meshes ({meshes.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-2">
                {meshes.map((m) => (
                  <div key={m.uuid} className="rounded-lg bg-secondary/30 p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[140px]">{m.name}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleMeshWireframe(m.uuid)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 border border-border/50 hover:border-primary/50 transition-colors"
                          title="Toggle wireframe"
                        >
                          Wire
                        </button>
                        <button onClick={() => toggleMeshVisibility(m.uuid)} title="Toggle visibility">
                          {m.visible ? (
                            <Eye size={12} className="text-primary" />
                          ) : (
                            <EyeOff size={12} className="text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex gap-3">
                      <span>{m.vertexCount.toLocaleString()} verts</span>
                      <span>{Math.round(m.faceCount).toLocaleString()} faces</span>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Materials ─── */}
          <AccordionItem value="materials" className="border-border/30">
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Paintbrush size={12} className="text-primary" /> Materials ({materials.length})
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="space-y-3">
                {materials.map((m) => (
                  <div key={m.uuid} className="rounded-lg bg-secondary/30 p-2 space-y-2">
                    <span className="text-xs font-medium truncate block">{m.name}</span>

                    {/* Color */}
                    {m.color !== null && (
                      <label className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted-foreground w-16">Color</span>
                        <input
                          type="color"
                          value={m.color}
                          onChange={(e) => setMaterialColor(m.uuid, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">{m.color}</span>
                      </label>
                    )}

                    {/* Emissive */}
                    {m.emissive !== null && (
                      <label className="flex items-center gap-2 text-[11px]">
                        <span className="text-muted-foreground w-16">Emissive</span>
                        <input
                          type="color"
                          value={m.emissive}
                          onChange={(e) => setMaterialEmissive(m.uuid, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-muted-foreground">{m.emissive}</span>
                      </label>
                    )}

                    {/* Metalness */}
                    {m.metalness !== null && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Metalness</span>
                          <span className="font-mono">{m.metalness.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={[m.metalness]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={([v]) => setMaterialMetalness(m.uuid, v)}
                          className="h-4"
                        />
                      </div>
                    )}

                    {/* Roughness */}
                    {m.roughness !== null && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Roughness</span>
                          <span className="font-mono">{m.roughness.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={[m.roughness]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={([v]) => setMaterialRoughness(m.uuid, v)}
                          className="h-4"
                        />
                      </div>
                    )}

                    {/* Opacity */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Opacity</span>
                        <span className="font-mono">{m.opacity.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[m.opacity]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => setMaterialOpacity(m.uuid, v)}
                        className="h-4"
                      />
                    </div>

                    {/* Toggles row */}
                    <div className="flex items-center gap-4 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Switch
                          checked={m.wireframe}
                          onCheckedChange={() => toggleMaterialWireframe(m.uuid)}
                          className="scale-75 origin-left"
                        />
                        <span className="text-muted-foreground">Wireframe</span>
                      </label>
                    </div>

                    {/* Side */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground">Side</span>
                      <select
                        value={m.side}
                        onChange={(e) => setMaterialSide(m.uuid, Number(e.target.value) as THREE.Side)}
                        className="bg-background/70 border border-border/50 rounded px-1.5 py-0.5 text-[10px] text-foreground"
                      >
                        <option value={THREE.FrontSide}>Front</option>
                        <option value={THREE.BackSide}>Back</option>
                        <option value={THREE.DoubleSide}>Double</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Textures ─── */}
          {textures.length > 0 && (
            <AccordionItem value="textures" className="border-border/30">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <Image size={12} className="text-primary" /> Textures ({textures.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-2">
                  {textures.map((t, i) => (
                    <div key={i} className="rounded-lg bg-secondary/30 p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[130px]">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground">{t.slot}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex gap-3">
                        <span>{t.width}×{t.height}</span>
                        <span>on {t.materialName}</span>
                      </div>
                      {/* Texture preview */}
                      {t.texture.image && (
                        <div className="w-full h-16 rounded overflow-hidden bg-background/50 mt-1">
                          <canvas
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                            ref={(canvas) => {
                              if (!canvas || !t.texture.image) return;
                              const ctx = canvas.getContext("2d");
                              if (!ctx) return;
                              try {
                                ctx.drawImage(t.texture.image, 0, 0, 64, 64);
                              } catch {
                                // cross-origin or non-drawable
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ─── Bones ─── */}
          {bones.length > 0 && (
            <AccordionItem value="bones" className="border-border/30">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <Layers size={12} className="text-primary" /> Skeleton ({totalBones} bones)
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="max-h-48 overflow-y-auto pr-1">
                  {bones.map((b, i) => (
                    <BoneNode key={i} info={b} onSelect={setSelectedBone} />
                  ))}
                </div>
                {/* Selected bone details */}
                {selectedBone && (
                  <div className="mt-2 rounded-lg bg-secondary/30 p-2 space-y-1">
                    <span className="text-xs font-medium">{selectedBone.name}</span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>Position</span>
                      <span className="font-mono text-foreground">
                        {selectedBone.position.x.toFixed(3)}, {selectedBone.position.y.toFixed(3)}, {selectedBone.position.z.toFixed(3)}
                      </span>
                      <span>Rotation</span>
                      <span className="font-mono text-foreground">
                        {(selectedBone.rotation.x * 180 / Math.PI).toFixed(1)}°, {(selectedBone.rotation.y * 180 / Math.PI).toFixed(1)}°, {(selectedBone.rotation.z * 180 / Math.PI).toFixed(1)}°
                      </span>
                      <span>Scale</span>
                      <span className="font-mono text-foreground">
                        {selectedBone.scale.x.toFixed(3)}, {selectedBone.scale.y.toFixed(3)}, {selectedBone.scale.z.toFixed(3)}
                      </span>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* ─── Morph Targets ─── */}
          {morphs.length > 0 && (
            <AccordionItem value="morphs" className="border-border/30">
              <AccordionTrigger className="py-2 text-xs hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal size={12} className="text-primary" /> Morph Targets ({morphs.length})
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-2">
                  {morphs.map((m, i) => (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground truncate max-w-[140px]" title={`${m.meshName} → ${m.name}`}>
                          {m.name}
                        </span>
                        <span className="font-mono text-[10px]">{m.value.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[m.value]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={([v]) => setMorphValue(m.mesh.uuid, m.index, v)}
                        className="h-4"
                      />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </ScrollArea>
  );
}
