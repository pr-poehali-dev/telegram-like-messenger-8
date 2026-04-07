import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface ChanMsg {
  id: number;
  senderId: number;
  text: string;
  time: string;
  senderName: string;
  senderUsername: string;
}

interface Channel {
  id: number;
  name: string;
  username: string;
  description: string;
  avatarColor: string;
  membersCount: number;
  role: string;
  ownerId: number;
}

interface ChannelWindowProps {
  channel: Channel;
  myId: number;
  onBack: () => void;
  onLeave: () => void;
}

export default function ChannelWindow({ channel, myId, onBack, onLeave }: ChannelWindowProps) {
  const [messages, setMessages] = useState<ChanMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const res = await api.channels.messages(channel.id);
    if (res.ok) setMessages(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [channel.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await api.channels.post(channel.id, text.trim());
    if (res.ok) {
      setMessages(prev => [...prev, res.data]);
      setText("");
    }
    setSending(false);
  };

  const handleLeave = async () => {
    if (channel.role === "admin") return;
    await api.channels.leave(channel.id);
    onLeave();
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const isAdmin = channel.role === "admin";

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${channel.avatarColor} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
          {channel.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{channel.name}</div>
          <div className="text-xs text-muted-foreground">{channel.membersCount} участников · @{channel.username}</div>
        </div>
        {!isAdmin && (
          <button onClick={handleLeave} className="w-9 h-9 rounded-xl glass border border-red-500/20 hover:bg-red-500/10 flex items-center justify-center text-red-400 transition-all">
            <Icon name="LogOut" size={16} />
          </button>
        )}
        {isAdmin && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Icon name="Shield" size={12} className="text-purple-400" />
            <span className="text-xs text-purple-400 font-medium">Админ</span>
          </div>
        )}
      </div>

      {/* Description */}
      {channel.description && (
        <div className="px-4 py-2 border-b border-white/5 bg-white/2">
          <p className="text-xs text-muted-foreground">{channel.description}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 flex items-center justify-center">
              <Icon name="Hash" size={24} className="text-purple-400" />
            </div>
            <p className="text-muted-foreground text-sm">В канале пока нет сообщений</p>
            <p className="text-xs text-muted-foreground">Станьте первым!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          const initials = msg.senderName.split(" ").map((w: string) => w[0]).slice(0, 2).join("");
          return (
            <div key={msg.id} className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 self-end">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-xs font-semibold ${isMe ? "text-purple-400" : "text-cyan-400"}`}>
                    {isMe ? "Вы" : msg.senderName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{fmt(msg.time)}</span>
                </div>
                <div className="msg-bubble-in px-3 py-2 inline-block max-w-full">
                  <p className="text-sm text-white leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Написать в ${channel.name}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <button onClick={send} disabled={sending || !text.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition-all disabled:opacity-30 flex-shrink-0 neon-purple">
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
