import { useState } from "react";
import Icon from "@/components/ui/icon";

interface ProfileTabProps {
  user: { id: number; name: string; username: string; about: string } | null;
  onLogout: () => void;
}

export default function ProfileTab({ user, onLogout }: ProfileTabProps) {
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "");
  const [editing, setEditing] = useState(false);

  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const notifications = [
    { label: "Сообщения", enabled: true },
    { label: "Звонки", enabled: true },
    { label: "Обновления статусов", enabled: false },
  ];

  const [notifs, setNotifs] = useState(notifications);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Profile card */}
      <div className="mx-3 mt-1 mb-3 glass rounded-2xl p-5 border border-white/8">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-black text-white text-xl neon-purple">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Icon name="Camera" size={11} className="text-white" />
            </button>
          </div>
          {editing ? (
            <div className="w-full space-y-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-purple-500/40 rounded-xl px-3 py-2 text-sm text-white text-center outline-none"
              />
              <input
                value={about}
                onChange={e => setAbout(e.target.value)}
                placeholder="О себе..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-muted-foreground text-center outline-none"
              />
              <button
                onClick={() => setEditing(false)}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Сохранить
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="font-bold text-white">{name}</div>
                {user?.username && (
                  <div className="text-xs text-purple-400 mt-0.5">@{user.username}</div>
                )}
                {about && <div className="text-xs text-muted-foreground mt-1">{about}</div>}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Icon name="Edit3" size={12} />
                Редактировать
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
          {[
            { label: "Чатов", value: "4" },
            { label: "Контактов", value: "6" },
            { label: "Статусов", value: "12" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Уведомления
      </div>
      <div className="mx-3 glass rounded-2xl border border-white/8 overflow-hidden mb-3">
        {notifs.map((n, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
            <span className="text-sm text-white">{n.label}</span>
            <button
              onClick={() => setNotifs(prev => prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p))}
              className={`w-10 h-5 rounded-full transition-all duration-300 relative ${n.enabled ? "bg-gradient-to-r from-purple-500 to-cyan-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${n.enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mx-3 space-y-2 pb-4">
        <button className="w-full flex items-center gap-3 px-4 py-3 glass rounded-2xl border border-white/8 hover:bg-white/5 transition-all">
          <Icon name="Shield" size={16} className="text-cyan-400" />
          <span className="text-sm text-white">Конфиденциальность</span>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground ml-auto" />
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 glass rounded-2xl border border-white/8 hover:bg-white/5 transition-all">
          <Icon name="HelpCircle" size={16} className="text-purple-400" />
          <span className="text-sm text-white">Поддержка</span>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground ml-auto" />
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 glass rounded-2xl border border-red-500/20 hover:bg-red-500/10 transition-all"
        >
          <Icon name="LogOut" size={16} className="text-red-400" />
          <span className="text-sm text-red-400">Выйти из аккаунта</span>
        </button>
      </div>
    </div>
  );
}
