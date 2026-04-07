import { useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface CreateChannelModalProps {
  onClose: () => void;
  onCreate: (channel: object) => void;
}

export default function CreateChannelModal({ onClose, onCreate }: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const autoUsername = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!username || username === autoUsername(name)) {
      setUsername(autoUsername(v));
    }
  };

  const submit = async () => {
    setError("");
    if (!name.trim() || !username.trim()) { setError("Заполните название и юзернейм"); return; }
    setLoading(true);
    const res = await api.channels.create(name.trim(), description.trim(), username.trim(), isPublic);
    setLoading(false);
    if (!res.ok) { setError(res.data.error || "Ошибка создания"); return; }
    onCreate(res.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong border border-white/10 rounded-3xl p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Новый канал</h2>
            <p className="text-xs text-muted-foreground">Создайте канал для общения</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-all">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Название канала</label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Например: Новости команды"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Юзернейм (@)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="channel_name"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Описание (необязательно)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="О чём этот канал?"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all resize-none"
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between p-3 glass rounded-xl">
            <div>
              <div className="text-sm text-white font-medium">Публичный канал</div>
              <div className="text-xs text-muted-foreground">Любой пользователь может найти и вступить</div>
            </div>
            <button
              onClick={() => setIsPublic(p => !p)}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${isPublic ? "bg-gradient-to-r from-purple-500 to-cyan-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${isPublic ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <Icon name="AlertCircle" size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-muted-foreground text-sm hover:text-white transition-all">
            Отмена
          </button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Plus" size={16} />}
            {loading ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
