import http.client
import json
import sqlite3
import time
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("API_KEY")

CACHE_TTL = {
    "leagues": 60 * 60 * 24 * 30,  # 30 dias
    "teams":   60 * 60 * 24 * 7,   # 7 dias
}

# ---------- Cache (banco separado do principal) ----------

def _get_cache_conn():
    os.makedirs("cache", exist_ok=True)
    return sqlite3.connect("cache/football_cache.db")

def _init_cache():
    conn = _get_cache_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            key        TEXT PRIMARY KEY,
            data       TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def _cache_get(key: str, ttl: int):
    conn = _get_cache_conn()
    row = conn.execute(
        "SELECT data, created_at FROM cache WHERE key = ?", (key,)
    ).fetchone()
    conn.close()
    if row is None:
        return None
    if time.time() - row[1] > ttl:
        return None
    return json.loads(row[0])

def _cache_set(key: str, data):
    conn = _get_cache_conn()
    conn.execute(
        "INSERT OR REPLACE INTO cache (key, data, created_at) VALUES (?, ?, ?)",
        (key, json.dumps(data), int(time.time()))
    )
    conn.commit()
    conn.close()

# ---------- HTTP ----------

def _request(endpoint: str) -> dict:
    conn = http.client.HTTPSConnection("v3.football.api-sports.io")
    conn.request("GET", endpoint, headers={"x-apisports-key": API_KEY})
    res = conn.getresponse()
    return json.loads(res.read().decode("utf-8"))

# ---------- Funções públicas ----------

def get_leagues(country: str = None) -> list:
    key = f"leagues|country={country}"
    cached = _cache_get(key, CACHE_TTL["leagues"])
    if cached:
        return cached

    params = "?current=true"
    if country:
        params += f"&country={country}"

    raw = _request(f"/leagues{params}")
    result = [
        {
            "id":      l["league"]["id"],
            "name":    l["league"]["name"],
            "logo":    l["league"]["logo"],
            "country": l["country"]["name"],
            "season":  l["seasons"][-1]["year"] if l.get("seasons") else None,
        }
        for l in raw.get("response", [])
    ]
    _cache_set(key, result)
    return result

def get_teams(league_id: int, season: int) -> list:
    key = f"teams|league={league_id}|season={season}"
    cached = _cache_get(key, CACHE_TTL["teams"])
    if cached:
        return cached

    raw = _request(f"/teams?league={league_id}&season={season}")
    result = [
        {
            "id":   t["team"]["id"],
            "name": t["team"]["name"],
            "logo": t["team"]["logo"],
        }
        for t in raw.get("response", [])
    ]
    _cache_set(key, result)
    return result

_init_cache()