"""
Авторизация пользователей: регистрация, вход, проверка сессии.
Роутинг через query-параметр ?action=register|login|me
"""
import os
import hashlib
import secrets
import psycopg2


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p94807568_telegram_like_messen")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": CORS, "body": data}


def err(code: int, msg: str) -> dict:
    return {"statusCode": code, "headers": CORS, "body": {"error": msg}}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = event.get("body") or {}
    if isinstance(body, str):
        import json
        body = json.loads(body)

    # POST ?action=register
    if method == "POST" and action == "register":
        name = (body.get("name") or "").strip()
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        if not name or not username or not password:
            return err(400, "Заполните все поля")
        if len(username) < 3:
            return err(400, "Логин минимум 3 символа")
        if len(password) < 6:
            return err(400, "Пароль минимум 6 символов")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return err(409, "Логин уже занят")

        pw_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (name, username, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (name, username, pw_hash)
        )
        user_id = cur.fetchone()[0]
        token = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
            (user_id, token)
        )
        conn.commit()
        conn.close()
        return ok({"token": token, "user": {"id": user_id, "name": name, "username": username, "about": ""}})

    # POST ?action=login
    if method == "POST" and action == "login":
        username = (body.get("username") or "").strip().lower()
        password = body.get("password") or ""

        if not username or not password:
            return err(400, "Заполните все поля")

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, about FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
            (username, pw_hash)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err(401, "Неверный логин или пароль")

        user_id, name, about = row
        token = secrets.token_hex(32)
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        conn.commit()
        conn.close()
        return ok({"token": token, "user": {"id": user_id, "name": name, "username": username, "about": about or ""}})

    # GET ?action=me
    if method == "GET" and action == "me":
        auth_header = event.get("headers", {}).get("X-Authorization", "")
        token = auth_header.replace("Bearer ", "").strip()
        if not token:
            return err(401, "Не авторизован")

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
            return err(401, "Сессия истекла")

        user_id, name, username, about = row
        return ok({"id": user_id, "name": name, "username": username, "about": about or ""})

    return err(404, "Not found")
