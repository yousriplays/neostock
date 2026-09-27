import hashlib
import json
import os
from datetime import datetime

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache", "api_responses")
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_key(prompt: str, model: str) -> str:
    content = f"{model}:{prompt}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached(prompt: str, model: str) -> dict | None:
    key = get_cache_key(prompt, model)
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def set_cache(prompt: str, model: str, response: dict) -> None:
    key = get_cache_key(prompt, model)
    path = os.path.join(CACHE_DIR, f"{key}.json")
    data = {
        "response": response,
        "model": model,
        "cached_at": datetime.now().isoformat(),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def clear_cache():
    for f in os.listdir(CACHE_DIR):
        os.remove(os.path.join(CACHE_DIR, f))
