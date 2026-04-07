import { useState, useRef, useEffect } from "react";
import type { Contact } from "@/lib/constants";

interface Message { id: number; from: "me" | "them"; text?: string; type: "text" | "voice"; duration?: number; time: string; }
interface Chat { id: number; contact: Contact; messages: Message[]; unread: number; }
import Avatar from "./Avatar";
import VoiceBubble from "./VoiceBubble";
import Icon from "@/components/ui/icon";

interface ChatWindowProps {
  chat: Chat;
  onBack: () => void;
  onSendMessage: (chatId: number, msg: Message) => void;
  onCall: (contact: Contact) => void;
}

export default function ChatWindow({ chat, onBack, onSendMessage, onCall }: ChatWindowProps) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg: Message = {
      id: Date.now(),
      from: "me",
      type: "text",
      text: text.trim(),
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
    };
    onSendMessage(chat.id, msg);
    setText("");
  };

  const startRecording = () => {
    setRecording(true);
    setRecordSeconds(0);
    timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = recordSeconds || 1;
    const msg: Message = {
      id: Date.now(),
      from: "me",
      type: "voice",
      duration,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
    };
    onSendMessage(chat.id, msg);
    setRecordSeconds(0);
  };

  const statusText = chat.contact.status === "online" ? "онлайн" :
    chat.contact.status === "away" ? (chat.contact.lastSeen || "отошёл") :
    (chat.contact.lastSeen || "не в сети");

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
        <Avatar contact={chat.contact} size="md" showStatus />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{chat.contact.name}</div>
          <div className={`text-xs ${chat.contact.status === "online" ? "text-green-400" : "text-muted-foreground"}`}>
            {statusText}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onCall(chat.contact)}
            className="w-9 h-9 rounded-xl glass border border-green-500/20 hover:bg-green-500/15 hover:border-green-500/40 flex items-center justify-center text-green-400 transition-all"
          >
            <Icon name="Phone" size={16} />
          </button>
          <button className="w-9 h-9 rounded-xl glass border border-white/10 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {chat.messages.map((msg, i) => (
          <div
            key={msg.id}
            style={{ animationDelay: `${i * 30}ms` }}
            className={`flex animate-fade-in ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            {msg.from === "them" && (
              <div className="mr-2 flex-shrink-0 self-end">
                <Avatar contact={chat.contact} size="sm" />
              </div>
            )}
            <div className={`max-w-[70%] ${msg.from === "me" ? "msg-bubble-out" : "msg-bubble-in"} px-4 py-2.5`}>
              {msg.type === "voice" ? (
                <VoiceBubble duration={msg.duration || 0} isOwn={msg.from === "me"} />
              ) : (
                <p className="text-sm text-white leading-relaxed">{msg.text}</p>
              )}
              <div className={`text-[10px] mt-1 ${msg.from === "me" ? "text-purple-200/70 text-right" : "text-muted-foreground"}`}>
                {msg.time}
                {msg.from === "me" && <Icon name="CheckCheck" size={11} className="inline ml-1 text-cyan-300" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-white/5 px-4 py-3 flex-shrink-0">
        {recording ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            <div className="flex gap-1 items-center">
              {[0, 1, 2, 3, 4].map(j => (
                <div
                  key={j}
                  className="w-1 bg-red-400 rounded-full wave-bar"
                  style={{ height: "16px", animationDelay: `${j * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-red-400 text-sm font-medium flex-1">
              Запись {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
            </span>
            <button
              onClick={stopRecording}
              className="w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all"
            >
              <Icon name="Square" size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all flex-shrink-0">
              <Icon name="Paperclip" size={18} />
            </button>
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
              <button
                onClick={send}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition-all flex-shrink-0 neon-purple"
              >
                <Icon name="Send" size={16} />
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-purple-400 hover:border-purple-500/30 transition-all flex-shrink-0"
              >
                <Icon name="Mic" size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}