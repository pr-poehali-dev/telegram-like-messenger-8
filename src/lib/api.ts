export const AUTH_URL = "https://functions.poehali.dev/60703da4-36e2-4c04-a1c9-13f3909521a0";
export const MESSAGES_URL = "https://functions.poehali.dev/b6e8e1da-4c40-40fd-a793-8c135a694981";
export const CHANNELS_URL = "https://functions.poehali.dev/2ac01647-94c7-4209-b9e3-a9f550ef244c";

export function getToken(): string {
  return localStorage.getItem("sevas_token") || "";
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`,
  };
}

async function call(url: string, params: string, options?: RequestInit) {
  const res = await fetch(`${url}?${params}`, options);
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: res.status, data: { error: text } };
  }
}

// Auth
export const api = {
  auth: {
    register: (name: string, username: string, password: string) =>
      call(AUTH_URL, "action=register", { method: "POST", headers: authHeaders(), body: JSON.stringify({ name, username, password }) }),
    login: (username: string, password: string) =>
      call(AUTH_URL, "action=login", { method: "POST", headers: authHeaders(), body: JSON.stringify({ username, password }) }),
    me: () => call(AUTH_URL, "action=me", { headers: authHeaders() }),
  },
  messages: {
    users: () => call(MESSAGES_URL, "action=users", { headers: authHeaders() }),
    dialogs: () => call(MESSAGES_URL, "action=dialogs", { headers: authHeaders() }),
    messages: (dialogId: number) => call(MESSAGES_URL, `action=messages&dialog_id=${dialogId}`, { headers: authHeaders() }),
    send: (toUserId: number, text: string, type = "text", voiceDuration?: number) =>
      call(MESSAGES_URL, "action=send", { method: "POST", headers: authHeaders(), body: JSON.stringify({ toUserId, text, type, voiceDuration }) }),
    openDialog: (toUserId: number) =>
      call(MESSAGES_URL, "action=open_dialog", { method: "POST", headers: authHeaders(), body: JSON.stringify({ toUserId }) }),
  },
  channels: {
    list: () => call(CHANNELS_URL, "action=list", { headers: authHeaders() }),
    explore: (q = "") => call(CHANNELS_URL, `action=explore&q=${encodeURIComponent(q)}`, { headers: authHeaders() }),
    messages: (channelId: number) => call(CHANNELS_URL, `action=messages&channel_id=${channelId}`, { headers: authHeaders() }),
    create: (name: string, description: string, username: string, isPublic: boolean) =>
      call(CHANNELS_URL, "action=create", { method: "POST", headers: authHeaders(), body: JSON.stringify({ name, description, username, isPublic }) }),
    join: (channelId: number) =>
      call(CHANNELS_URL, "action=join", { method: "POST", headers: authHeaders(), body: JSON.stringify({ channelId }) }),
    leave: (channelId: number) =>
      call(CHANNELS_URL, "action=leave", { method: "POST", headers: authHeaders(), body: JSON.stringify({ channelId }) }),
    post: (channelId: number, text: string) =>
      call(CHANNELS_URL, "action=post", { method: "POST", headers: authHeaders(), body: JSON.stringify({ channelId, text }) }),
  },
};
