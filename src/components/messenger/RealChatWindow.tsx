import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface RealMsg {
  id: number;
  senderId: number;
  text?: string;
  type: string;
  voiceDuration?: number;
  time: string;
  senderName: string;
}

interface RealChatWindowProps {
  dialogId: number;
  partnerId: number;
  partnerName: string;
  partnerUsername: string;
  partnerStatus: string;
  myId: number;
  onBack: () => void;
  onCall: (name: string, username: string) => void;
}

export default function RealChatWindow({ dialogId, partnerId, partnerName, partnerUsername, partnerStatus, myId, onBack, onCall }: RealChatWindowProps) {
  const [messages, setMessages] = useState<RealMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const res = await api.messages.messages(dialogId);
    if (res.ok) setMessages(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [dialogId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await api.messages.send(partnerId, text.trim());
    if (res.ok) {
      setMessages(prev => [...prev, res.data]);
      setText("");
    }
    setSending(false);
  };

  const startRec = () => {
    setRecording(true);
    setRecordSec(0);
    timerRef.current = setInterval(() => setRecordSec(s => s + 1), 1000);
  };

  const stopRec = async () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const dur = recordSec || 1;
    const res = await api.messages.send(partnerId, `[Голосовое ${dur}с]`, "voice", dur);
    if (res.ok) setMessages(prev => [...prev, res.data]);
    setRecordSec(0);
  };

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  const initials = partnerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const statusColor = partnerStatus === "online" ? "text-green-400" : "text-muted-foreground";
  const statusLabel = partnerStatus === "online" ? "онлайн" : "не в сети";

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{partnerName}</div>
          <div className={`text-xs ${statusColor}`}>{statusLabel}</div>
        </div>
        <button onClick={() => onCall(partnerName, partnerUsername)} className="w-9 h-9 rounded-xl glass border border-green-500/20 hover:bg-green-500/15 flex items-center justify-center text-green-400 transition-all">
          <Icon name="Phone" size={16} />
        </button>
        <button className="w-9 h-9 rounded-xl glass border border-white/10 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
          <Icon name="MoreVertical" size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center">
              <Icon name="MessageCircle" size={24} className="text-purple-400" />
            </div>
            <p className="text-muted-foreground text-sm">Начните общение с {partnerName}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex animate-fade-in ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <div className="mr-2 flex-shrink-0 self-end w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {msg.senderName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
              )}
              <div className={`max-w-[70%] ${isMe ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
                {msg.type === "voice" ? (
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="Play" size={12} className="text-white" />
                    </div>
                    <div className="flex gap-0.5 items-center h-6 flex-1">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-white/40 rounded-full" style={{ height: `${30 + Math.random() * 50}%` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/60">{msg.voiceDuration || 0}с</span>
                  </div>
                ) : (
                  <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                )}
                <div className={`text-[10px] mt-1 ${isMe ? "text-purple-200/70 text-right" : "text-muted-foreground"}`}>
                  {fmt(msg.time)}
                  {isMe && <Icon name="CheckCheck" size={11} className="inline ml-1 text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 px-4 py-3 flex-shrink-0">
        {recording ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <div className="flex gap-1 items-center">
              {[0,1,2,3,4].map(j => (
                <div key={j} className="w-1 bg-red-400 rounded-full wave-bar" style={{ height: "16px", animationDelay: `${j * 150}ms` }} />
              ))}
            </div>
            <span className="text-red-400 text-sm font-medium flex-1">
              {String(Math.floor(recordSec/60)).padStart(2,"0")}:{String(recordSec%60).padStart(2,"0")}
            </span>
            <button onClick={stopRec} className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center text-white">
              <Icon name="Square" size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Написать сообщение..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
            {text.trim() ? (
              <button onClick={send} disabled={sending} className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition-all neon-purple flex-shrink-0">
                <Icon name="Send" size={16} />
              </button>
            ) : (
              <button onMouseDown={startRec} onMouseUp={stopRec} onTouchStart={startRec} onTouchEnd={stopRec}
                className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-purple-400 transition-all flex-shrink-0">
                <Icon name="Mic" size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
