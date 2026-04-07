import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/60703da4-36e2-4c04-a1c9-13f3909521a0";

interface AuthScreenProps {
  onAuth: (token: string, user: { id: number; name: string; username: string; about: string }) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const action = mode === "login" ? "login" : "register";
      const body: Record<string, string> = { username, password };
      if (mode === "register") body.name = name;

      const res = await fetch(`${AUTH_URL}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        setError(data.error || "Что-то пошло не так");
        return;
      }

      localStorage.setItem("sevas_token", data.token);
      onAuth(data.token, data.user);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg h-screen flex items-center justify-center font-golos p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 rounded-full bg-pink-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(139,92,246,0.5)" }}>
            <span className="text-white font-black text-2xl">S</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">Sevas</h1>
            <p className="text-muted-foreground text-sm mt-1">Общайтесь. Создавайте. Объединяйтесь.</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong border border-white/10 rounded-3xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "register"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <div className="animate-fade-in">
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Имя</label>
                <div className="relative">
                  <Icon name="User" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Логин</label>
              <div className="relative">
                <Icon name="AtSign" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="имя_пользователя"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Пароль</label>
              <div className="relative">
                <Icon name="Lock" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
              <Icon name="AlertCircle" size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 neon-purple flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === "login" ? "Входим..." : "Создаём аккаунт..."}
              </>
            ) : (
              <>
                <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            {mode === "login" ? "Зарегистрируйтесь" : "Войдите"}
          </button>
        </p>
      </div>
    </div>
  );
}