import { User, Bot, Sword, PersonStanding, Loader2 } from "lucide-react";
import { useState } from "react";

const DEMO_MODELS = [
  {
    name: "Soldier",
    icon: Sword,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb",
    description: "Military character with animations",
  },
  {
    name: "Robot",
    icon: Bot,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
    description: "Expressive robot with face morphs",
  },
  {
    name: "Xbot",
    icon: PersonStanding,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb",
    description: "Humanoid character model",
  },
  {
    name: "Michelle",
    icon: User,
    url: "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb",
    description: "Ready Player Me avatar",
  },
];

interface ModelSidebarProps {
  onSelectModel: (url: string) => void;
  activeUrl: string | null;
}

export default function ModelSidebar({ onSelectModel, activeUrl }: ModelSidebarProps) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  const handleSelect = (url: string) => {
    if (url === activeUrl) return;
    setLoadingUrl(url);
    onSelectModel(url);
    // Clear loading after a short delay (model viewer takes over)
    setTimeout(() => setLoadingUrl(null), 1500);
  };

  return (
    <aside className="w-[220px] flex-shrink-0 border-r border-border/40 glass flex flex-col">
      <div className="px-4 py-3 border-b border-border/30">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Demo Models
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {DEMO_MODELS.map((model) => {
          const isActive = activeUrl === model.url;
          const isLoading = loadingUrl === model.url;
          const Icon = model.icon;

          return (
            <button
              key={model.name}
              onClick={() => handleSelect(model.url)}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all group ${
                isActive
                  ? "bg-primary/15 border border-primary/30 glow-border"
                  : "hover:bg-secondary/40 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isLoading ? (
                  <Loader2 size={16} className="text-primary animate-spin" />
                ) : (
                  <Icon
                    size={16}
                    className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
                  />
                )}
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {model.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 ml-[26px] leading-tight">
                {model.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Or upload your own .glb file
        </p>
      </div>
    </aside>
  );
}
