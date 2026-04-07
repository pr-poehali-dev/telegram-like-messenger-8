"""
API личных сообщений Sevas: диалоги, отправка, получение, список пользователей.
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p94807568_telegram_like_messen")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user(token: str):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT u.id, u.name, u.username, u.about
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "username": row[2], "about": row[3] or ""}


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

    # GET ?action=users — список всех пользователей (кроме себя)
    if method == "GET" and action == "users":
        if not user:
            return err(401, "Не авторизован")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, username, about, status, last_seen FROM {SCHEMA}.users WHERE id != %s ORDER BY name",
            (user["id"],)
        )
        rows = cur.fetchall()
        conn.close()
        users = [{"id": r[0], "name": r[1], "username": r[2], "about": r[3] or "", "status": r[4], "lastSeen": str(r[5])} for r in rows]
        return ok(users)

    # GET ?action=dialogs — все диалоги пользователя
    if method == "GET" and action == "dialogs":
        if not user:
            return err(401, "Не авторизован")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT d.id,
                       CASE WHEN d.user1_id = %s THEN d.user2_id ELSE d.user1_id END as partner_id,
                       u.name, u.username, u.about, u.status,
                       (SELECT text FROM {SCHEMA}.messages m WHERE m.dialog_id = d.id ORDER BY m.created_at DESC LIMIT 1) as last_text,
                       (SELECT msg_type FROM {SCHEMA}.messages m WHERE m.dialog_id = d.id ORDER BY m.created_at DESC LIMIT 1) as last_type,
                       (SELECT created_at FROM {SCHEMA}.messages m WHERE m.dialog_id = d.id ORDER BY m.created_at DESC LIMIT 1) as last_time,
                       (SELECT COUNT(*) FROM {SCHEMA}.messages m WHERE m.dialog_id = d.id AND m.sender_id != %s AND m.is_read = FALSE) as unread
                FROM {SCHEMA}.dialogs d
                JOIN {SCHEMA}.users u ON u.id = CASE WHEN d.user1_id = %s THEN d.user2_id ELSE d.user1_id END
                WHERE d.user1_id = %s OR d.user2_id = %s
                ORDER BY last_time DESC NULLS LAST""",
            (user["id"], user["id"], user["id"], user["id"], user["id"])
        )
        rows = cur.fetchall()
        conn.close()
        dialogs = []
        for r in rows:
            dialogs.append({
                "id": r[0], "partnerId": r[1], "partnerName": r[2],
                "partnerUsername": r[3], "partnerAbout": r[4] or "",
                "partnerStatus": r[5],
                "lastText": r[6] or "", "lastType": r[7] or "text",
                "lastTime": str(r[8]) if r[8] else "",
                "unread": r[9]
            })
        return ok(dialogs)

    # GET ?action=messages&dialog_id=X — сообщения диалога
    if method == "GET" and action == "messages":
        if not user:
            return err(401, "Не авторизован")
        dialog_id = params.get("dialog_id")
        if not dialog_id:
            return err(400, "Нет dialog_id")
        conn = get_conn()
        cur = conn.cursor()
        # Проверяем что пользователь участник диалога
        cur.execute(
            f"SELECT id FROM {SCHEMA}.dialogs WHERE id = %s AND (user1_id = %s OR user2_id = %s)",
            (dialog_id, user["id"], user["id"])
        )
        if not cur.fetchone():
            conn.close()
            return err(403, "Нет доступа")
        # Отмечаем как прочитанные
        cur.execute(
            f"UPDATE {SCHEMA}.messages SET is_read = TRUE WHERE dialog_id = %s AND sender_id != %s",
            (dialog_id, user["id"])
        )
        cur.execute(
            f"""SELECT m.id, m.sender_id, m.text, m.msg_type, m.voice_duration, m.created_at, u.name, u.username
                FROM {SCHEMA}.messages m
                JOIN {SCHEMA}.users u ON u.id = m.sender_id
                WHERE m.dialog_id = %s
                ORDER BY m.created_at ASC LIMIT 200""",
            (dialog_id,)
        )
        rows = cur.fetchall()
        conn.commit()
        conn.close()
        msgs = [{"id": r[0], "senderId": r[1], "text": r[2], "type": r[3],
                 "voiceDuration": r[4], "time": str(r[5]), "senderName": r[6], "senderUsername": r[7]} for r in rows]
        return ok(msgs)

    # POST ?action=send — отправить сообщение
    if method == "POST" and action == "send":
        if not user:
            return err(401, "Не авторизован")
        to_user_id = body.get("toUserId")
        text = (body.get("text") or "").strip()
        msg_type = body.get("type", "text")
        voice_duration = body.get("voiceDuration")

        if not to_user_id:
            return err(400, "Нет получателя")
        if msg_type == "text" and not text:
            return err(400, "Пустое сообщение")

        conn = get_conn()
        cur = conn.cursor()

        # Найти или создать диалог
        u1 = min(user["id"], to_user_id)
        u2 = max(user["id"], to_user_id)
        cur.execute(
            f"SELECT id FROM {SCHEMA}.dialogs WHERE user1_id = %s AND user2_id = %s",
            (u1, u2)
        )
        row = cur.fetchone()
        if row:
            dialog_id = row[0]
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.dialogs (user1_id, user2_id) VALUES (%s, %s) RETURNING id",
                (u1, u2)
            )
            dialog_id = cur.fetchone()[0]

        cur.execute(
            f"""INSERT INTO {SCHEMA}.messages (dialog_id, sender_id, text, msg_type, voice_duration)
                VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at""",
            (dialog_id, user["id"], text or None, msg_type, voice_duration)
        )
        msg_id, created_at = cur.fetchone()
        conn.commit()
        conn.close()

        return ok({"id": msg_id, "dialogId": dialog_id, "senderId": user["id"],
                   "text": text, "type": msg_type, "voiceDuration": voice_duration,
                   "time": str(created_at), "senderName": user["name"]})

    # POST ?action=open_dialog — открыть/создать диалог с пользователем
    if method == "POST" and action == "open_dialog":
        if not user:
            return err(401, "Не авторизован")
        to_user_id = body.get("toUserId")
        if not to_user_id:
            return err(400, "Нет toUserId")
        conn = get_conn()
        cur = conn.cursor()
        u1 = min(user["id"], to_user_id)
        u2 = max(user["id"], to_user_id)
        cur.execute(f"SELECT id FROM {SCHEMA}.dialogs WHERE user1_id = %s AND user2_id = %s", (u1, u2))
        row = cur.fetchone()
        if row:
            dialog_id = row[0]
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.dialogs (user1_id, user2_id) VALUES (%s, %s) RETURNING id", (u1, u2))
            dialog_id = cur.fetchone()[0]
        conn.commit()
        # получить инфо о партнёре
        cur.execute(f"SELECT id, name, username, about, status FROM {SCHEMA}.users WHERE id = %s", (to_user_id,))
        p = cur.fetchone()
        conn.close()
        return ok({"dialogId": dialog_id, "partnerId": p[0], "partnerName": p[1],
                   "partnerUsername": p[2], "partnerAbout": p[3] or "", "partnerStatus": p[4]})

    return err(404, "Not found")
