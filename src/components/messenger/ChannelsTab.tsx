import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import CreateChannelModal from "./CreateChannelModal";
import Icon from "@/components/ui/icon";

interface Channel {
  id: number;
  name: string;
  username: string;
  description: string;
  avatarColor: string;
  membersCount: number;
  role: string;
  ownerId: number;
  lastText: string;
  lastTime: string;
}

interface ChannelsTabProps {
  onOpenChannel: (ch: Channel) => void;
  activeChannelId?: number | null;
  refreshKey: number;
}

export default function ChannelsTab({ onOpenChannel, activeChannelId, refreshKey }: ChannelsTabProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [exploreChannels, setExploreChannels] = useState<(Channel & { isMember: boolean })[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"my" | "explore">("my");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);

  const loadMy = async () => {
    const res = await api.channels.list();
    if (res.ok) setChannels(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  const loadExplore = async (q: string) => {
    const res = await api.channels.explore(q);
    if (res.ok) setExploreChannels(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => { loadMy(); }, [refreshKey]);

  useEffect(() => {
    if (mode === "explore") loadExplore(search);
  }, [mode, search]);

  const join = async (ch: Channel & { isMember: boolean }) => {
    if (ch.isMember) { onOpenChannel(ch); return; }
    setJoining(ch.id);
    const res = await api.channels.join(ch.id);
    if (res.ok) {
      await loadMy();
      await loadExplore(search);
      onOpenChannel({ ...ch, role: "member" });
    }
    setJoining(null);
  };

  const fmt = (iso: string) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск каналов..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1">
          {[["my", "Мои"], ["explore", "Все"]].map(([id, label]) => (
            <button key={id} onClick={() => setMode(id as "my" | "explore")}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${mode === id ? "bg-gradient-to-r from-purple-500/30 to-cyan-500/20 border border-purple-500/30 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition-all flex-shrink-0 neon-purple">
            <Icon name="Plus" size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {mode === "my" && (
          <>
            {loading && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}
            {!loading && channels.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Icon name="Hash" size={20} className="text-purple-400" />
                </div>
                <p className="text-muted-foreground text-sm">Вы не состоите ни в одном канале</p>
                <button onClick={() => setMode("explore")}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Найти каналы →
                </button>
              </div>
            )}
            {channels.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())).map((ch, i) => (
              <button key={ch.id} onClick={() => onOpenChannel(ch)} style={{ animationDelay: `${i * 40}ms` }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all animate-fade-in text-left ${activeChannelId === ch.id ? "bg-gradient-to-r from-purple-500/15 to-cyan-500/10 border border-purple-500/20" : "hover:bg-white/5"}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.avatarColor} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                  {ch.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-white truncate">{ch.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">{fmt(ch.lastTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {ch.role === "admin" && <Icon name="Shield" size={10} className="text-purple-400 flex-shrink-0" />}
                    <p className="text-xs text-muted-foreground truncate">{ch.lastText || `${ch.membersCount} участников`}</p>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {mode === "explore" && (
          <>
            {exploreChannels.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center px-4">
                <Icon name="Search" size={20} className="text-muted-foreground" />
                <p className="text-muted-foreground text-sm">Введите запрос для поиска</p>
              </div>
            )}
            {exploreChannels.map((ch, i) => (
              <div key={ch.id} style={{ animationDelay: `${i * 40}ms` }}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-all animate-fade-in">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ch.avatarColor} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                  {ch.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-white">{ch.name}</div>
                  <div className="text-xs text-muted-foreground">@{ch.username} · {ch.membersCount} уч.</div>
                </div>
                <button onClick={() => join(ch)} disabled={joining === ch.id}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex-shrink-0 ${ch.isMember ? "bg-white/10 text-white hover:bg-white/15" : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90"}`}>
                  {joining === ch.id ? "..." : ch.isMember ? "Открыть" : "Вступить"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {showCreate && (
        <CreateChannelModal onClose={() => setShowCreate(false)} onCreate={() => { loadMy(); }} />
      )}
    </div>
  );
}
