import json
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from utils.config import Config
from utils.cache import get_cached, set_cache


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


def predict_gemini(product: dict) -> dict:
    """Call Google Gemini Flash for demand prediction."""
    if not HAS_GENAI:
        raise ImportError("google-generativeai non installé")
    if not Config.has_gemini():
        raise ConnectionError("Clé API Gemini non configurée")
    
    prompt = build_prediction_prompt(product)
    
    # Check cache
    cached = get_cached(prompt, Config.GEMINI_MODEL)
    if cached:
        return cached["response"]
    
    genai.configure(api_key=Config.GEMINI_API_KEY)
    model = genai.GenerativeModel(Config.GEMINI_MODEL)
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=300,
            )
        )
        
        content = response.text.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        
        prediction = json.loads(content)
        prediction["method"] = "gemini"
        prediction["model"] = Config.GEMINI_MODEL
        
        set_cache(prompt, Config.GEMINI_MODEL, prediction)
        return prediction
    
    except json.JSONDecodeError:
        raise ValueError(f"Gemini: réponse JSON invalide: {content[:200]}")
    except Exception as e:
        raise ConnectionError(f"Gemini: {str(e)}")
