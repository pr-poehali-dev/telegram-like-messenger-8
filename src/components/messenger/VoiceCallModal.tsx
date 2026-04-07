import { useState, useEffect } from "react";
import type { Contact } from "@/pages/Index";
import { avatarColors } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface VoiceCallModalProps {
  contact: Contact;
  onClose: () => void;
}

export default function VoiceCallModal({ contact, onClose }: VoiceCallModalProps) {
  const [state, setState] = useState<"calling" | "connected">("calling");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);
  const colorIdx = contact.id % avatarColors.length;

  useEffect(() => {
    const t = setTimeout(() => setState("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state !== "connected") return;
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-80 glass-strong border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-6 animate-scale-in">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-purple-500/10 to-cyan-500/5 pointer-events-none" />

        {/* Avatar with pulse */}
        <div className="relative">
          {state === "calling" && (
            <>
              <div className="absolute inset-0 rounded-full pulse-anim scale-150 opacity-30 bg-purple-500" />
              <div className="absolute inset-0 rounded-full pulse-anim scale-125 opacity-20 bg-purple-500" style={{ animationDelay: "0.5s" }} />
            </>
          )}
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center font-bold text-white text-2xl relative z-10 ${state === "connected" ? "neon-purple" : ""}`}>
            {contact.avatar}
          </div>
          {state === "connected" && (
            <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0d0d16] z-20 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-1">{contact.name}</h3>
          <p className="text-sm text-muted-foreground">
            {state === "calling" ? (
              <span className="flex items-center gap-1 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Вызов...
              </span>
            ) : (
              <span className="text-green-400 font-medium">{formatDuration(duration)}</span>
            )}
          </p>
        </div>

        {/* Sound waves when connected */}
        {state === "connected" && !muted && (
          <div className="flex items-center gap-1 h-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full wave-bar"
                style={{ height: "100%", animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setMuted(m => !m)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              muted
                ? "bg-red-500/20 border border-red-500/40 text-red-400"
                : "glass border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon name={muted ? "MicOff" : "Mic"} size={20} />
          </button>

          <button
            onClick={onClose}
            className="w-16 h-16 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg"
          >
            <Icon name="PhoneOff" size={24} />
          </button>

          <button
            onClick={() => setSpeaker(s => !s)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              speaker
                ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/30 text-purple-400"
                : "glass border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon name={speaker ? "Volume2" : "VolumeX"} size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
