-- Личные чаты (диалоги между двумя пользователями)
CREATE TABLE IF NOT EXISTS t_p94807568_telegram_like_messen.dialogs (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    user2_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Сообщения в личных чатах
CREATE TABLE IF NOT EXISTS t_p94807568_telegram_like_messen.messages (
    id SERIAL PRIMARY KEY,
    dialog_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.dialogs(id),
    sender_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    text TEXT,
    msg_type VARCHAR(20) DEFAULT 'text',
    voice_duration INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Каналы
CREATE TABLE IF NOT EXISTS t_p94807568_telegram_like_messen.channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    username VARCHAR(50) UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    avatar_color VARCHAR(50) DEFAULT 'from-purple-500 to-cyan-500',
    is_public BOOLEAN DEFAULT TRUE,
    members_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Участники каналов
CREATE TABLE IF NOT EXISTS t_p94807568_telegram_like_messen.channel_members (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.channels(id),
    user_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- Сообщения в каналах
CREATE TABLE IF NOT EXISTS t_p94807568_telegram_like_messen.channel_messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.channels(id),
    sender_id INTEGER NOT NULL REFERENCES t_p94807568_telegram_like_messen.users(id),
    text TEXT NOT NULL,
    msg_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_messages_dialog ON t_p94807568_telegram_like_messen.messages(dialog_id, created_at);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON t_p94807568_telegram_like_messen.channel_messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_channel_members_user ON t_p94807568_telegram_like_messen.channel_members(user_id);
