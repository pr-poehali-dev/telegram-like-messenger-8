import { useState } from "react";
import type { Contact } from "@/lib/constants";
interface Message { id: number; from: "me" | "them"; text?: string; type: "text" | "voice"; duration?: number; time: string; }
interface Chat { id: number; contact: Contact; messages: Message[]; unread: number; }
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface ChatsTabProps {
  chats: Chat[];
  onOpenChat: (chat: Chat) => void;
  activeChat: Chat | null;
}

export default function ChatsTab({ chats, onOpenChat, activeChat }: ChatsTabProps) {
  const [search, setSearch] = useState("");

  const filtered = chats.filter(c =>
    c.contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const getLastMessage = (chat: Chat) => {
    const last = chat.messages[chat.messages.length - 1];
    if (!last) return "";
    if (last.type === "voice") return "🎤 Голосовое сообщение";
    return last.text || "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск чатов..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {filtered.map((chat, i) => {
          const isActive = activeChat?.id === chat.id;
          const last = chat.messages[chat.messages.length - 1];
          return (
            <button
              key={chat.id}
              onClick={() => onOpenChat(chat)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 animate-fade-in text-left ${
                isActive
                  ? "bg-gradient-to-r from-purple-500/15 to-cyan-500/10 border border-purple-500/20"
                  : "hover:bg-white/5"
              }`}
            >
              <Avatar contact={chat.contact} size="md" showStatus />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-white truncate">{chat.contact.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{last?.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {last?.from === "me" && <span className="text-purple-400 mr-1">Вы:</span>}
                    {getLastMessage(chat)}
                  </p>
                  {chat.unread > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}