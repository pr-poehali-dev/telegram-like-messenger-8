"""
API каналов Sevas: создание, поиск, вступление, сообщения в каналах.
"""
import json
import os
import re
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p94807568_telegram_like_messen")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

AVATAR_COLORS = [
    "from-purple-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-orange-500",
    "from-green-500 to-cyan-500",
    "from-orange-500 to-yellow-500",
    "from-blue-500 to-purple-500",
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(token: str):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.name, u.username
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    return {"id": row[0], "name": row[1], "username": row[2]} if row else None


def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    auth = (event.get("headers") or {}).get("X-Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    user = get_user(token)

    raw_body = event.get("body") or "{}"
    body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

    # GET ?action=list — каналы пользователя + публичные топ
    if method == "GET" and action == "list":
        if not user:
            return err(401, "Не авторизован")
        conn = get_conn()
        cur = conn.cursor()
        # Каналы в которых состоит пользователь
        cur.execute(
            f"""SELECT c.id, c.name, c.description, c.username, c.owner_id,
                       c.avatar_color, c.is_public, c.members_count, c.created_at,
                       cm.role,
                       (SELECT text FROM {SCHEMA}.channel_messages cm2 WHERE cm2.channel_id = c.id ORDER BY cm2.created_at DESC LIMIT 1) as last_text,
                       (SELECT created_at FROM {SCHEMA}.channel_messages cm2 WHERE cm2.channel_id = c.id ORDER BY cm2.created_at DESC LIMIT 1) as last_time
                FROM {SCHEMA}.channels c
                JOIN {SCHEMA}.channel_members cm ON cm.channel_id = c.id AND cm.user_id = %s
                ORDER BY last_time DESC NULLS LAST""",
            (user["id"],)
        )
        rows = cur.fetchall()
        conn.close()
        channels = [{"id": r[0], "name": r[1], "description": r[2], "username": r[3],
                     "ownerId": r[4], "avatarColor": r[5], "isPublic": r[6],
                     "membersCount": r[7], "createdAt": str(r[8]), "role": r[9],
                     "lastText": r[10] or "", "lastTime": str(r[11]) if r[11] else ""} for r in rows]
        return ok(channels)

    # GET ?action=explore — публичные каналы для поиска
    if method == "GET" and action == "explore":
        if not user:
            return err(401, "Не авторизован")
        q = params.get("q", "").strip()
        conn = get_conn()
        cur = conn.cursor()
        if q:
            cur.execute(
                f"""SELECT c.id, c.name, c.description, c.username, c.owner_id, c.avatar_color, c.members_count,
                           (SELECT 1 FROM {SCHEMA}.channel_members cm WHERE cm.channel_id = c.id AND cm.user_id = %s) as is_member
                    FROM {SCHEMA}.channels c
                    WHERE c.is_public = TRUE AND (LOWER(c.name) LIKE %s OR LOWER(c.username) LIKE %s)
                    ORDER BY c.members_count DESC LIMIT 30""",
                (user["id"], f"%{q.lower()}%", f"%{q.lower()}%")
            )
        else:
            cur.execute(
                f"""SELECT c.id, c.name, c.description, c.username, c.owner_id, c.avatar_color, c.members_count,
                           (SELECT 1 FROM {SCHEMA}.channel_members cm WHERE cm.channel_id = c.id AND cm.user_id = %s) as is_member
                    FROM {SCHEMA}.channels c
                    WHERE c.is_public = TRUE
                    ORDER BY c.members_count DESC LIMIT 30""",
                (user["id"],)
            )
        rows = cur.fetchall()
        conn.close()
        return ok([{"id": r[0], "name": r[1], "description": r[2], "username": r[3],
                    "ownerId": r[4], "avatarColor": r[5], "membersCount": r[6],
                    "isMember": bool(r[7])} for r in rows])

    # GET ?action=messages&channel_id=X — сообщения канала
    if method == "GET" and action == "messages":
        if not user:
            return err(401, "Не авторизован")
        channel_id = params.get("channel_id")
        if not channel_id:
            return err(400, "Нет channel_id")
        conn = get_conn()
        cur = conn.cursor()
        # Проверяем членство
        cur.execute(
            f"SELECT id FROM {SCHEMA}.channel_members WHERE channel_id = %s AND user_id = %s",
            (channel_id, user["id"])
        )
        if not cur.fetchone():
            conn.close()
            return err(403, "Не являетесь участником канала")
        cur.execute(
            f"""SELECT cm.id, cm.sender_id, cm.text, cm.msg_type, cm.created_at, u.name, u.username
                FROM {SCHEMA}.channel_messages cm
                JOIN {SCHEMA}.users u ON u.id = cm.sender_id
                WHERE cm.channel_id = %s
                ORDER BY cm.created_at ASC LIMIT 200""",
            (channel_id,)
        )
        rows = cur.fetchall()
        conn.close()
        return ok([{"id": r[0], "senderId": r[1], "text": r[2], "type": r[3],
                    "time": str(r[4]), "senderName": r[5], "senderUsername": r[6]} for r in rows])

    # POST ?action=create — создать канал
    if method == "POST" and action == "create":
        if not user:
            return err(401, "Не авторизован")
        name = (body.get("name") or "").strip()
        description = (body.get("description") or "").strip()
        username = (body.get("username") or "").strip().lower()
        is_public = body.get("isPublic", True)

        if not name or not username:
            return err(400, "Название и юзернейм обязательны")
        if len(name) < 2:
            return err(400, "Название минимум 2 символа")
        if len(username) < 3:
            return err(400, "Юзернейм минимум 3 символа")
        if not re.match(r'^[a-z0-9_]+$', username):
            return err(400, "Юзернейм только буквы, цифры и _")

        color = AVATAR_COLORS[user["id"] % len(AVATAR_COLORS)]
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.channels WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return err(409, "Юзернейм канала уже занят")

        cur.execute(
            f"""INSERT INTO {SCHEMA}.channels (name, description, username, owner_id, avatar_color, is_public)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (name, description, username, user["id"], color, is_public)
        )
        channel_id = cur.fetchone()[0]
        # Добавляем создателя как admin
        cur.execute(
            f"INSERT INTO {SCHEMA}.channel_members (channel_id, user_id, role) VALUES (%s, %s, 'admin')",
            (channel_id, user["id"])
        )
        conn.commit()
        conn.close()
        return ok({"id": channel_id, "name": name, "username": username, "ownerId": user["id"],
                   "avatarColor": color, "description": description, "isPublic": is_public,
                   "membersCount": 1, "role": "admin"})

    # POST ?action=join — вступить в канал
    if method == "POST" and action == "join":
        if not user:
            return err(401, "Не авторизован")
        channel_id = body.get("channelId")
        if not channel_id:
            return err(400, "Нет channelId")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, is_public FROM {SCHEMA}.channels WHERE id = %s", (channel_id,))
        ch = cur.fetchone()
        if not ch:
            conn.close()
            return err(404, "Канал не найден")
        cur.execute(
            f"SELECT id FROM {SCHEMA}.channel_members WHERE channel_id = %s AND user_id = %s",
            (channel_id, user["id"])
        )
        if cur.fetchone():
            conn.close()
            return err(409, "Уже являетесь участником")
        cur.execute(
            f"INSERT INTO {SCHEMA}.channel_members (channel_id, user_id, role) VALUES (%s, %s, 'member')",
            (channel_id, user["id"])
        )
        cur.execute(
            f"UPDATE {SCHEMA}.channels SET members_count = members_count + 1 WHERE id = %s",
            (channel_id,)
        )
        conn.commit()
        conn.close()
        return ok({"success": True})

    # POST ?action=leave — покинуть канал
    if method == "POST" and action == "leave":
        if not user:
            return err(401, "Не авторизован")
        channel_id = body.get("channelId")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT role FROM {SCHEMA}.channel_members WHERE channel_id = %s AND user_id = %s",
            (channel_id, user["id"])
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err(404, "Вы не участник")
        if row[0] == "admin":
            conn.close()
            return err(403, "Администратор не может покинуть канал")
        cur.execute(
            f"UPDATE {SCHEMA}.channel_members SET role='left' WHERE channel_id = %s AND user_id = %s",
            (channel_id, user["id"])
        )
        cur.execute(
            f"UPDATE {SCHEMA}.channels SET members_count = GREATEST(members_count - 1, 0) WHERE id = %s",
            (channel_id,)
        )
        conn.commit()
        conn.close()
        return ok({"success": True})

    # POST ?action=post — отправить сообщение в канал
    if method == "POST" and action == "post":
        if not user:
            return err(401, "Не авторизован")
        channel_id = body.get("channelId")
        text = (body.get("text") or "").strip()
        if not channel_id or not text:
            return err(400, "Нет channelId или текста")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT role FROM {SCHEMA}.channel_members WHERE channel_id = %s AND user_id = %s AND role != 'left'",
            (channel_id, user["id"])
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err(403, "Не участник канала")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.channel_messages (channel_id, sender_id, text)
                VALUES (%s, %s, %s) RETURNING id, created_at""",
            (channel_id, user["id"], text)
        )
        msg_id, created_at = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": msg_id, "channelId": channel_id, "senderId": user["id"],
                   "text": text, "time": str(created_at), "senderName": user["name"],
                   "senderUsername": user["username"]})

    return err(404, "Not found")
