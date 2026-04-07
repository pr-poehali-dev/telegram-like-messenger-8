import type { Contact } from "@/lib/constants";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface StatusTabProps {
  contacts: Contact[];
}

const statuses = [
  { contactId: 1, emoji: "🚀", text: "Работаю над крутым проектом!", time: "2 мин назад", views: 12 },
  { contactId: 3, emoji: "☕", text: "Утро начинается с кофе и кода", time: "1 ч назад", views: 34 },
  { contactId: 5, emoji: "🎨", text: "Новый дизайн готов!", time: "3 ч назад", views: 57 },
  { contactId: 2, emoji: "💼", text: "Встреча прошла продуктивно", time: "вчера", views: 8 },
];

export default function StatusTab({ contacts }: StatusTabProps) {
  const myStatus = { emoji: "✨", text: "Всё отлично!", time: "Сейчас" };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-2">
      {/* My status */}
      <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Мой статус
      </div>
      <div className="mx-1 mb-3 glass rounded-2xl p-4 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white text-sm neon-purple">
            Я
          </div>
          <div>
            <div className="font-semibold text-sm text-white">Мой статус</div>
            <div className="text-xs text-muted-foreground">{myStatus.time}</div>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2 mb-3">
          <span className="text-2xl">{myStatus.emoji}</span>
          <span className="text-sm text-white">{myStatus.text}</span>
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/20 text-purple-300 text-sm hover:from-purple-500/30 transition-all">
          <Icon name="Edit3" size={14} />
          Изменить статус
        </button>
      </div>

      {/* Others statuses */}
      <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        Обновления контактов
      </div>
      <div className="space-y-1 px-1">
        {statuses.map((s, i) => {
          const contact = contacts.find(c => c.id === s.contactId);
          if (!contact) return null;
          return (
            <div
              key={i}
              style={{ animationDelay: `${i * 60}ms` }}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer animate-fade-in group"
            >
              <div className="relative">
                <Avatar contact={contact} size="md" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-[10px]">
                  {s.emoji}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">{contact.name}</span>
                  <span className="text-[10px] text-muted-foreground">{s.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.text}</p>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="Eye" size={12} />
                <span className="text-[10px]">{s.views}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}