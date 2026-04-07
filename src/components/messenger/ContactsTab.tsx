import { useState } from "react";
import type { Contact } from "@/pages/Index";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface ContactsTabProps {
  contacts: Contact[];
  onCall: (contact: Contact) => void;
  onChat: (contact: Contact) => void;
}

export default function ContactsTab({ contacts, onCall, onChat }: ContactsTabProps) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabel = (c: Contact) => {
    if (c.status === "online") return { text: "онлайн", color: "text-green-400" };
    if (c.status === "away") return { text: c.lastSeen || "отошёл", color: "text-yellow-400" };
    return { text: c.lastSeen || "был(а) давно", color: "text-muted-foreground" };
  };

  const online = filtered.filter(c => c.status === "online");
  const rest = filtered.filter(c => c.status !== "online");

  const ContactItem = ({ contact, i }: { contact: Contact; i: number }) => {
    const sl = statusLabel(contact);
    return (
      <div
        key={contact.id}
        style={{ animationDelay: `${i * 40}ms` }}
        className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-all animate-fade-in group"
      >
        <Avatar contact={contact} size="md" showStatus />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-white">{contact.name}</div>
          <div className={`text-xs ${sl.color}`}>{sl.text}</div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onChat(contact)}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-purple-500/20 transition-all text-purple-400"
          >
            <Icon name="MessageCircle" size={15} />
          </button>
          <button
            onClick={() => onCall(contact)}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center hover:bg-green-500/20 transition-all text-green-400"
          >
            <Icon name="Phone" size={15} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-3">
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск контактов..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {online.length > 0 && (
          <>
            <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Онлайн · {online.length}
            </div>
            {online.map((c, i) => <ContactItem key={c.id} contact={c} i={i} />)}
          </>
        )}
        {rest.length > 0 && (
          <>
            <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-2">
              Остальные · {rest.length}
            </div>
            {rest.map((c, i) => <ContactItem key={c.id} contact={c} i={i} />)}
          </>
        )}
      </div>
    </div>
  );
}
