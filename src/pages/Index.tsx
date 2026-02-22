import { useState, useCallback } from "react";
import ModelViewer from "@/components/ModelViewer";
import ChatPanel from "@/components/ChatPanel";
import UploadButton from "@/components/UploadButton";
import ModelSidebar from "@/components/ModelSidebar";
import ModelInspector from "@/components/ModelInspector";
import { Cpu } from "lucide-react";
import * as THREE from "three";

const Index = () => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [loadedScene, setLoadedScene] = useState<THREE.Object3D | null>(null);

  const handleSceneReady = useCallback((scene: THREE.Object3D | null) => {
    setLoadedScene(scene);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 glass z-10">
        <div className="flex items-center gap-3">
          <Cpu size={22} className="text-primary" />
          <h1 className="text-lg font-semibold tracking-tight glow-text text-foreground">
            GLB<span className="text-primary">Viewer</span>
          </h1>
        </div>
        <UploadButton onFileSelect={setModelUrl} hasModel={!!modelUrl} />
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <ModelSidebar onSelectModel={setModelUrl} activeUrl={modelUrl} />

        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <ModelViewer modelUrl={modelUrl} onSceneReady={handleSceneReady} />

          {/* Overlay hint when no model */}
          {!modelUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-3 opacity-60">
                <p className="text-muted-foreground text-sm">
                  Select a demo model or upload a <span className="text-primary font-mono">.glb</span> file
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Inspector + Chat stacked */}
        <div className="w-[380px] flex flex-col flex-shrink-0 border-l border-border/40">
          {/* Model Inspector — collapsible top section */}
          {loadedScene && (
            <div className="h-[50%] border-b border-border/40 overflow-hidden">
              <ModelInspector scene={loadedScene} />
            </div>
          )}
          {/* Chat Panel */}
          <div className={`${loadedScene ? "h-[50%]" : "h-full"} p-3`}>
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
