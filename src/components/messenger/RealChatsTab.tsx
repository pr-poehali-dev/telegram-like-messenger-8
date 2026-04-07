import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface Dialog {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerUsername: string;
  partnerAbout: string;
  partnerStatus: string;
  lastText: string;
  lastType: string;
  lastTime: string;
  unread: number;
}

interface RealChatsTabProps {
  myId: number;
  onOpenDialog: (d: Dialog) => void;
  activeDialogId?: number | null;
  refreshKey: number;
}

export default function RealChatsTab({ myId, onOpenDialog, activeDialogId, refreshKey }: RealChatsTabProps) {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; username: string; status: string }[]>([]);
  const [search, setSearch] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);

  const load = async () => {
    const res = await api.messages.dialogs();
    if (res.ok) setDialogs(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  const loadUsers = async () => {
    const res = await api.messages.users();
    if (res.ok) setUsers(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [refreshKey]);

  const startDialog = async (userId: number) => {
    setStarting(userId);
    const res = await api.messages.openDialog(userId);
    if (res.ok) {
      await load();
      onOpenDialog({ id: res.data.dialogId, partnerId: res.data.partnerId, partnerName: res.data.partnerName,
        partnerUsername: res.data.partnerUsername, partnerAbout: res.data.partnerAbout,
        partnerStatus: res.data.partnerStatus, lastText: "", lastType: "text", lastTime: "", unread: 0 });
      setShowUsers(false);
    }
    setStarting(null);
  };

  const fmt = (iso: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
      return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  const filtered = dialogs.filter(d => !search || d.partnerName.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = dialogs.reduce((s, d) => s + (d.unread || 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск чатов..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all" />
        </div>
        <button onClick={() => { setShowUsers(!showUsers); if (!showUsers) loadUsers(); }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-purple-500/15 to-cyan-500/10 border border-purple-500/20 text-purple-300 text-sm hover:from-purple-500/25 transition-all">
          <Icon name="UserPlus" size={14} />
          Новое сообщение
        </button>
      </div>

      {showUsers && (
        <div className="mx-2 mb-2 glass rounded-2xl border border-white/8 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-white/5">
            Все пользователи
          </div>
          <div className="max-h-48 overflow-y-auto">
            {users.map(u => (
              <button key={u.id} onClick={() => startDialog(u.id)} disabled={starting === u.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-all text-left">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === "online" ? "bg-green-400" : "bg-gray-500"}`} />
              </button>
            ))}
            {users.length === 0 && <p className="text-center text-muted-foreground text-xs py-3">Нет других пользователей</p>}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {loading && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}
        {!loading && filtered.length === 0 && !showUsers && (
          <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <Icon name="MessageCircle" size={20} className="text-purple-400" />
            </div>
            <p className="text-muted-foreground text-sm">Нет активных чатов</p>
            <p className="text-xs text-muted-foreground">Напишите кому-нибудь первым!</p>
          </div>
        )}
        {filtered.map((d, i) => {
          const initials = d.partnerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
          const isActive = activeDialogId === d.id;
          return (
            <button key={d.id} onClick={() => onOpenDialog(d)} style={{ animationDelay: `${i * 40}ms` }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all animate-fade-in text-left ${isActive ? "bg-gradient-to-r from-purple-500/15 to-cyan-500/10 border border-purple-500/20" : "hover:bg-white/5"}`}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                  {initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[hsl(var(--background))] ${d.partnerStatus === "online" ? "bg-green-400" : "bg-gray-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm text-white truncate">{d.partnerName}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{fmt(d.lastTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {d.lastType === "voice" ? "🎤 Голосовое" : (d.lastText || "Нет сообщений")}
                  </p>
                  {d.unread > 0 && (
                    <span className="ml-2 min-w-[18px] h-[18px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 flex-shrink-0">
                      {d.unread}
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
