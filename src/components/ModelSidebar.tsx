import { User, Bot, Sword, PersonStanding, Loader2, ChevronRight } from "lucide-react";
import { useState } from "react";

const DEMO_MODELS = [
  {
    name: "Soldier",
    icon: Sword,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb",
    description: "Military character",
  },
  {
    name: "Robot",
    icon: Bot,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
    description: "Expressive robot",
  },
  {
    name: "Xbot",
    icon: PersonStanding,
    url: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb",
    description: "Humanoid model",
  },
  {
    name: "Michelle",
    icon: User,
    url: "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb",
    description: "RPM avatar",
  },
];

interface ModelSidebarProps {
  onSelectModel: (url: string) => void;
  activeUrl: string | null;
}

export default function ModelSidebar({ onSelectModel, activeUrl }: ModelSidebarProps) {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSelect = (url: string) => {
    if (url === activeUrl) return;
    setLoadingUrl(url);
    onSelectModel(url);
    setTimeout(() => setLoadingUrl(null), 2000);
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`flex-shrink-0 border-r border-border/40 glass flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        expanded ? "w-[200px]" : "w-[52px]"
      }`}
    >
      {/* Expand indicator */}
      <div className="px-3 py-3 border-b border-border/30 flex items-center gap-2">
        <ChevronRight
          size={16}
          className={`text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
        <span
          className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap transition-opacity duration-200 ${
            expanded ? "opacity-100" : "opacity-0"
          }`}
        >
          Models
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {DEMO_MODELS.map((model) => {
          const isActive = activeUrl === model.url;
          const isLoading = loadingUrl === model.url;
          const Icon = model.icon;

          return (
            <button
              key={model.name}
              onClick={() => handleSelect(model.url)}
              title={model.name}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-all group ${
                isActive
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-secondary/40 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isLoading ? (
                  <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
                ) : (
                  <Icon
                    size={16}
                    className={`flex-shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                )}
                <span
                  className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${
                    expanded ? "opacity-100" : "opacity-0"
                  } ${isActive ? "text-primary" : "text-foreground"}`}
                >
                  {model.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
