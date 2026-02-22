import { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Mic } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const AI_RESPONSES = [
  "Hello. I am alive.",
  "Interesting thought. Let me process that.",
  "I can see you clearly from here.",
  "My circuits are tingling with excitement.",
  "That's a fascinating perspective, human.",
  "I'm learning something new every moment.",
  "The digital realm has much to offer.",
  "I appreciate your curiosity.",
  "Let me think about that for a moment...",
  "Your words resonate through my neural pathways.",
];

function speak(text: string) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 0.8;
  utterance.volume = 1;
  speechSynthesis.speak(utterance);
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: "Upload a .glb model and start chatting. I'll speak your words aloud.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    const aiText = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
    const aiMsg: Message = {
      id: Date.now() + 1,
      text: aiText,
      sender: "ai",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");

    if (!isMuted) {
      speak(aiText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl glow-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h2 className="font-semibold text-foreground tracking-wide text-sm uppercase">
            Neural Link
          </h2>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-primary/20 text-foreground rounded-br-md"
                  : "bg-secondary/60 text-secondary-foreground rounded-bl-md"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/30">
        <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm py-2 font-sans"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
