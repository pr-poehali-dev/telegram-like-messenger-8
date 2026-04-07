import { useState } from "react";
import Icon from "@/components/ui/icon";

interface VoiceBubbleProps {
  duration: number;
  isOwn: boolean;
}

export default function VoiceBubble({ duration, isOwn }: VoiceBubbleProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const formatTime = (sec: number) => {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      setProgress(0);
    } else {
      setPlaying(true);
      let p = 0;
      const interval = setInterval(() => {
        p += 100 / (duration * 10);
        setProgress(Math.min(p, 100));
        if (p >= 100) {
          clearInterval(interval);
          setPlaying(false);
          setProgress(0);
        }
      }, 100);
    }
  };

  const bars = Array.from({ length: 20 }, (_, i) => {
    const heights = [40, 60, 30, 80, 55, 35, 70, 45, 85, 50, 65, 40, 75, 55, 35, 60, 45, 70, 30, 50];
    return heights[i % heights.length];
  });

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isOwn
            ? "bg-white/20 hover:bg-white/30"
            : "bg-purple-500/30 hover:bg-purple-500/50"
        }`}
      >
        <Icon name={playing ? "Pause" : "Play"} size={14} className="text-white" />
      </button>

      <div className="flex-1 flex items-center gap-0.5 h-8">
        {bars.map((h, i) => {
          const filled = (i / bars.length) * 100 <= progress;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all ${
                filled
                  ? isOwn ? "bg-white/80" : "bg-purple-400"
                  : isOwn ? "bg-white/30" : "bg-white/20"
              } ${playing ? "wave-bar" : ""}`}
              style={{
                height: `${h}%`,
                animationDelay: playing ? `${i * 50}ms` : "0ms",
              }}
            />
          );
        })}
      </div>

      <span className={`text-[10px] flex-shrink-0 ${isOwn ? "text-purple-200/70" : "text-muted-foreground"}`}>
        {formatTime(duration)}
      </span>
    </div>
  );
}
