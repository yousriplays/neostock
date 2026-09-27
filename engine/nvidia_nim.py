import json
import requests
from utils.config import Config
from utils.cache import get_cached, set_cache

NVIDIA_ENDPOINT = f"{Config.NVIDIA_API_BASE}/chat/completions"

def build_prediction_prompt(product: dict) -> str:
    sales_str = ", ".join([f"{h['month']}: {h['sales']}" for h in product.get("sales_history", [])[-6:]])
    return f"""Tu es un analyste d'inventaire expert pour un commerce tunisien.
Analyse ce produit et prédis la demande du mois prochain.

Produit : {product['name']}
Catégorie : {product['category']}
Ventes des 6 derniers mois : {sales_str}
Stock actuel : {product['current_stock']} {product['unit']}
Ventes mensuelles moyennes : {product.get('avg_monthly_sales', 'N/A')}
Mois actuel : Octobre 2026 (post-rentrée scolaire en Tunisie)

Réponds UNIQUEMENT en JSON valide :
{{
  "predicted_demand": <entier>,
  "confidence": "élevé" | "moyen" | "faible",
  "reasoning": "<1-2 phrases en français>",
  "seasonal_factor": "aucun" | "ramadan" | "été" | "rentrée" | "aïd",
  "trend": "hausse" | "stable" | "baisse"
}}"""


def predict_nvidia(product: dict) -> dict:
    """Call NVIDIA NIM API via Brev credits for demand prediction."""
    if not Config.has_nvidia():
        raise ConnectionError("Clé API NVIDIA non configurée")
    
    prompt = build_prediction_prompt(product)
    
    # Check cache first
    cached = get_cached(prompt, Config.NVIDIA_MODEL)
    if cached:
        return cached["response"]
    
    headers = {
        "Authorization": f"Bearer {Config.NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": Config.NVIDIA_MODEL,
        "messages": [
            {"role": "system", "content": "Tu es un assistant d'analyse d'inventaire pour les commerces tunisiens. Réponds toujours en JSON valide."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 300,
    }
    
    try:
        response = requests.post(
            NVIDIA_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse JSON from response
        # Handle cases where model wraps in ```json ... ```
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        
        prediction = json.loads(content)
        prediction["method"] = "nvidia_nim"
        prediction["model"] = Config.NVIDIA_MODEL
        
        # Cache the result
        set_cache(prompt, Config.NVIDIA_MODEL, prediction)
        
        return prediction
    
    except requests.exceptions.Timeout:
        raise ConnectionError("NVIDIA NIM: timeout après 30s")
    except requests.exceptions.HTTPError as e:
        raise ConnectionError(f"NVIDIA NIM: erreur HTTP {e.response.status_code}")
    except json.JSONDecodeError:
        raise ValueError(f"NVIDIA NIM: réponse JSON invalide: {content[:200]}")
