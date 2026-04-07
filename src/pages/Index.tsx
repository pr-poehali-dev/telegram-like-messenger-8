import { useState } from "react";
import ChatsTab from "@/components/messenger/ChatsTab";
import ContactsTab from "@/components/messenger/ContactsTab";
import StatusTab from "@/components/messenger/StatusTab";
import ProfileTab from "@/components/messenger/ProfileTab";
import ChatWindow from "@/components/messenger/ChatWindow";
import VoiceCallModal from "@/components/messenger/VoiceCallModal";
import Icon from "@/components/ui/icon";

type Tab = "chats" | "contacts" | "status" | "profile";

export interface Contact {
  id: number;
  name: string;
  avatar: string;
  status: "online" | "away" | "offline";
  lastSeen?: string;
  about?: string;
}

export interface Message {
  id: number;
  from: "me" | "them";
  text?: string;
  type: "text" | "voice";
  duration?: number;
  time: string;
}

export interface Chat {
  id: number;
  contact: Contact;
  messages: Message[];
  unread: number;
}

const contacts: Contact[] = [
  { id: 1, name: "Алина Морозова", avatar: "АМ", status: "online", about: "На связи всегда 🚀" },
  { id: 2, name: "Денис Ковалёв", avatar: "ДК", status: "away", lastSeen: "15 мин назад", about: "Работаю над проектом" },
  { id: 3, name: "Маша Петрова", avatar: "МП", status: "online", about: "Кофе и код ☕" },
  { id: 4, name: "Игорь Захаров", avatar: "ИЗ", status: "offline", lastSeen: "2 ч назад", about: "Недоступен" },
  { id: 5, name: "Катя Волкова", avatar: "КВ", status: "online", about: "Дизайнер 🎨" },
  { id: 6, name: "Рома Степанов", avatar: "РС", status: "away", lastSeen: "5 мин назад" },
];

const initialChats: Chat[] = [
  {
    id: 1,
    contact: contacts[0],
    unread: 2,
    messages: [
      { id: 1, from: "them", type: "text", text: "Привет! Как дела? 👋", time: "10:30" },
      { id: 2, from: "me", type: "text", text: "Отлично! Работаю над новым проектом", time: "10:32" },
      { id: 3, from: "them", type: "voice", duration: 12, time: "10:35" },
      { id: 4, from: "them", type: "text", text: "Это звучит здорово! Расскажи подробнее 🚀", time: "10:36" },
    ]
  },
  {
    id: 2,
    contact: contacts[1],
    unread: 0,
    messages: [
      { id: 1, from: "me", type: "text", text: "Денис, когда встреча?", time: "09:15" },
      { id: 2, from: "them", type: "text", text: "В 15:00, не забудь!", time: "09:20" },
    ]
  },
  {
    id: 3,
    contact: contacts[2],
    unread: 5,
    messages: [
      { id: 1, from: "them", type: "text", text: "Смотри что нашла! 😍", time: "вчера" },
      { id: 2, from: "them", type: "voice", duration: 45, time: "вчера" },
    ]
  },
  {
    id: 4,
    contact: contacts[4],
    unread: 0,
    messages: [
      { id: 1, from: "me", type: "voice", duration: 8, time: "пн" },
      { id: 2, from: "them", type: "text", text: "Получила, спасибо! 🎨", time: "пн" },
    ]
  },
];

export const avatarColors = [
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-pink-500 to-orange-500",
  "from-green-500 to-cyan-500",
  "from-orange-500 to-yellow-500",
  "from-blue-500 to-purple-500",
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [callTarget, setCallTarget] = useState<Contact | null>(null);

  const openChat = (chat: Chat) => {
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
    setActiveChat({ ...chat, unread: 0 });
  };

  const sendMessage = (chatId: number, msg: Message) => {
    setChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c
    ));
    if (activeChat?.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null);
    }
  };

  const startCall = (contact: Contact) => {
    setCallTarget(contact);
  };

  const tabs = [
    { id: "chats" as Tab, icon: "MessageCircle", label: "Чаты" },
    { id: "contacts" as Tab, icon: "Users", label: "Контакты" },
    { id: "status" as Tab, icon: "Circle", label: "Статус" },
    { id: "profile" as Tab, icon: "User", label: "Профиль" },
  ];

  const totalUnread = chats.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="gradient-bg h-screen flex overflow-hidden font-golos">
      {/* Sidebar */}
      <div className="w-[340px] flex flex-col glass border-r border-white/5 flex-shrink-0 relative z-10">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center neon-purple">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <span className="font-black text-xl tracking-tight text-white">Pulse</span>
          {totalUnread > 0 && (
            <span className="ml-auto text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chats" && (
            <ChatsTab chats={chats} onOpenChat={openChat} activeChat={activeChat} />
          )}
          {activeTab === "contacts" && (
            <ContactsTab contacts={contacts} onCall={startCall} onChat={(contact) => {
              const existing = chats.find(c => c.contact.id === contact.id);
              if (existing) { openChat(existing); setActiveTab("chats"); }
            }} />
          )}
          {activeTab === "status" && <StatusTab contacts={contacts} />}
          {activeTab === "profile" && <ProfileTab />}
        </div>

        {/* Bottom Nav */}
        <div className="p-3 glass-strong border-t border-white/5">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "nav-item-active"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <div className="relative">
                  <Icon name={tab.icon} size={20} />
                  {tab.id === "chats" && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onBack={() => setActiveChat(null)}
            onSendMessage={sendMessage}
            onCall={startCall}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center neon-purple">
                <span className="text-white font-black text-2xl">P</span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Добро пожаловать в Pulse</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Выберите чат слева или найдите контакт, чтобы начать общение
              </p>
            </div>
            <div className="flex gap-3">
              <div className="glass rounded-2xl px-4 py-3 text-center">
                <div className="text-neon-purple font-bold text-xl">{chats.length}</div>
                <div className="text-muted-foreground text-xs">Чатов</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3 text-center">
                <div className="text-neon-cyan font-bold text-xl">{contacts.filter(c => c.status === "online").length}</div>
                <div className="text-muted-foreground text-xs">Онлайн</div>
              </div>
              <div className="glass rounded-2xl px-4 py-3 text-center">
                <div className="font-bold text-xl text-pink-400">{totalUnread}</div>
                <div className="text-muted-foreground text-xs">Непрочитано</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Call Modal */}
      {callTarget && (
        <VoiceCallModal contact={callTarget} onClose={() => setCallTarget(null)} />
      )}
    </div>
  );
}
