import { useState, useEffect } from "react";
import AuthScreen from "@/components/messenger/AuthScreen";
import RealChatsTab from "@/components/messenger/RealChatsTab";
import ChannelsTab from "@/components/messenger/ChannelsTab";
import ProfileTab from "@/components/messenger/ProfileTab";
import RealChatWindow from "@/components/messenger/RealChatWindow";
import ChannelWindow from "@/components/messenger/ChannelWindow";
import VoiceCallModal from "@/components/messenger/VoiceCallModal";
import Icon from "@/components/ui/icon";
import { api, AUTH_URL } from "@/lib/api";

type Tab = "chats" | "channels" | "profile";



type AuthUser = { id: number; name: string; username: string; about: string };

interface ActiveDialog {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerUsername: string;
  partnerStatus: string;
}

interface ActiveChannel {
  id: number;
  name: string;
  username: string;
  description: string;
  avatarColor: string;
  membersCount: number;
  role: string;
  ownerId: number;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const [activeChannel, setActiveChannel] = useState<ActiveChannel | null>(null);
  const [callTarget, setCallTarget] = useState<{ name: string; username: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("sevas_token") || localStorage.getItem("pulse_token");
    if (!token) { setAuthChecked(true); return; }
    // Ensure both keys set
    localStorage.setItem("sevas_token", token);
    fetch(`${AUTH_URL}?action=me`, { headers: { "Authorization": `Bearer ${token}` } })
      .then(r => r.text()).then(text => {
        try {
          const data = JSON.parse(text);
          if (data.id) setAuthUser(data);
        } catch (_e) { /* ignore */ }
      })
      .catch((_e) => { /* ignore */ })
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) {
    return (
      <div className="gradient-bg h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <AuthScreen onAuth={(token, user) => {
        localStorage.setItem("sevas_token", token);
        setAuthUser(user);
      }} />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("sevas_token");
    localStorage.removeItem("pulse_token");
    setAuthUser(null);
  };

  const tabs = [
    { id: "chats" as Tab, icon: "MessageCircle", label: "Чаты" },
    { id: "channels" as Tab, icon: "Hash", label: "Каналы" },
    { id: "profile" as Tab, icon: "User", label: "Профиль" },
  ];

  const openDialog = (d: { id: number; partnerId: number; partnerName: string; partnerUsername: string; partnerStatus: string }) => {
    setActiveDialog(d);
    setActiveChannel(null);
  };

  const openChannel = (ch: ActiveChannel) => {
    setActiveChannel(ch);
    setActiveDialog(null);
  };

  const mainContent = () => {
    if (activeDialog) {
      return (
        <RealChatWindow
          key={activeDialog.id}
          dialogId={activeDialog.id}
          partnerId={activeDialog.partnerId}
          partnerName={activeDialog.partnerName}
          partnerUsername={activeDialog.partnerUsername}
          partnerStatus={activeDialog.partnerStatus}
          myId={authUser.id}
          onBack={() => setActiveDialog(null)}
          onCall={(name, username) => setCallTarget({ name, username })}
        />
      );
    }
    if (activeChannel) {
      return (
        <ChannelWindow
          key={activeChannel.id}
          channel={activeChannel}
          myId={authUser.id}
          onBack={() => setActiveChannel(null)}
          onLeave={() => { setActiveChannel(null); setRefreshKey(k => k + 1); }}
        />
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in p-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}>
            <span className="text-white font-black text-2xl">S</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2">Добро пожаловать, {authUser.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Выберите чат слева, вступите в канал или напишите кому-нибудь первым
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab("chats")} className="glass rounded-2xl px-4 py-3 text-center hover:bg-white/8 transition-all border border-white/5">
            <Icon name="MessageCircle" size={20} className="text-violet-400 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Чаты</div>
          </button>
          <button onClick={() => setActiveTab("channels")} className="glass rounded-2xl px-4 py-3 text-center hover:bg-white/8 transition-all border border-white/5">
            <Icon name="Hash" size={20} className="text-fuchsia-400 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Каналы</div>
          </button>
          <button onClick={() => setActiveTab("profile")} className="glass rounded-2xl px-4 py-3 text-center hover:bg-white/8 transition-all border border-white/5">
            <Icon name="User" size={20} className="text-pink-400 mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Профиль</div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="gradient-bg h-screen flex overflow-hidden font-golos">
      {/* Sidebar */}
      <div className="w-[340px] flex flex-col glass border-r border-white/5 flex-shrink-0 relative z-10">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 16px rgba(139,92,246,0.5)" }}>
            <span className="text-white font-black text-base">S</span>
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white">Sevas</span>
            <div className="text-[10px] text-muted-foreground -mt-0.5">@{authUser.username}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-400 font-medium">онлайн</span>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "chats" && (
            <RealChatsTab
              myId={authUser.id}
              onOpenDialog={openDialog}
              activeDialogId={activeDialog?.id}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === "channels" && (
            <ChannelsTab
              onOpenChannel={openChannel}
              activeChannelId={activeChannel?.id}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab user={authUser} onLogout={handleLogout} />
          )}
        </div>

        {/* Bottom Nav */}
        <div className="p-3 glass-strong border-t border-white/5">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveDialog(null); setActiveChannel(null); }}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id && !activeDialog && !activeChannel
                    ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 border border-violet-500/30 text-violet-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}>
                <Icon name={tab.icon} size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {mainContent()}
      </div>

      {/* Voice call */}
      {callTarget && (
        <VoiceCallModal
          contact={{ id: 0, name: callTarget.name, avatar: callTarget.name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase(), status: "online" }}
          onClose={() => setCallTarget(null)}
        />
      )}
    </div>
  );
}