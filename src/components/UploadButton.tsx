import { Upload, Box } from "lucide-react";
import { useRef } from "react";

interface UploadButtonProps {
  onFileSelect: (url: string) => void;
  hasModel: boolean;
}

export default function UploadButton({ onFileSelect, hasModel }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onFileSelect(url);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="glass glow-border flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/50 transition-all hover:scale-105 active:scale-95"
      >
        {hasModel ? <Box size={16} className="text-primary" /> : <Upload size={16} className="text-primary" />}
        {hasModel ? "Change Model" : "Upload .GLB"}
      </button>
    </>
  );
}
