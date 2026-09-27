"""Main prediction engine with 4-layer fallback chain."""
import time
from engine.nvidia_nim import predict_nvidia
from engine.gemini import predict_gemini
from engine.statistical import predict_statistical
from engine.eoq import smart_reorder


def validate_prediction(prediction: dict, product: dict) -> dict:
    """Sanity-check AI predictions against historical data."""
    avg = product.get("avg_monthly_sales", product.get("base_monthly_demand", 50))
    pred = prediction.get("predicted_demand", avg)
    
    max_reasonable = avg * 5
    min_reasonable = max(1, avg * 0.1)
    
    if pred > max_reasonable:
        prediction["predicted_demand"] = int(max_reasonable)
        prediction["confidence"] = "faible"
        prediction["warning"] = f"Plafonné: dépassait 5× la moyenne ({avg:.0f})"
    elif pred < min_reasonable:
        prediction["predicted_demand"] = int(min_reasonable)
        prediction["confidence"] = "faible"
        prediction["warning"] = f"Relevé: en dessous du seuil minimum"
    
    return prediction


def predict_demand(product: dict) -> dict:
    """4-layer fallback prediction engine.
    
    Layer 1: NVIDIA NIM (via Brev $100 credits) — best quality
    Layer 2: Google Gemini Flash (free tier) — great backup
    Layer 3: Statistical (WMA + seasonal) — always works, local
    Layer 4: Rule-based (last month + 10%) — absolute fallback
    """
    errors = []
    start_time = time.time()
    
    # Layer 1: NVIDIA NIM
    try:
        result = predict_nvidia(product)
        result = validate_prediction(result, product)
        result["method"] = "nvidia_nim"
        result["method_label"] = "🟢 NVIDIA NIM (Brev)"
        result["latency_ms"] = int((time.time() - start_time) * 1000)
        return result
    except Exception as e:
        errors.append(f"NVIDIA NIM: {e}")
    
    # Layer 2: Gemini Flash
    try:
        result = predict_gemini(product)
        result = validate_prediction(result, product)
        result["method"] = "gemini"
        result["method_label"] = "🔵 Google Gemini Flash"
        result["latency_ms"] = int((time.time() - start_time) * 1000)
        return result
    except Exception as e:
        errors.append(f"Gemini: {e}")
    
    # Layer 3: Statistical
    try:
        result = predict_statistical(product)
        result["method_label"] = "🟡 Modèle statistique"
        result["latency_ms"] = int((time.time() - start_time) * 1000)
        return result
    except Exception as e:
        errors.append(f"Statistique: {e}")
    
    # Layer 4: Rule-based (ALWAYS works)
    last_month = product.get("sales_history", [{}])[-1].get("sales", product.get("base_monthly_demand", 50))
    result = {
        "predicted_demand": int(last_month * 1.1),
        "confidence": "faible",
        "reasoning": "Basé sur les ventes du dernier mois + 10% de marge",
        "seasonal_factor": "aucun",
        "trend": "stable",
        "method": "rule_based",
        "method_label": "🔴 Règles de base",
        "model": "last_month + 10%",
        "latency_ms": int((time.time() - start_time) * 1000),
    }
    
    if errors:
        result["fallback_reasons"] = errors
    
    return result


def full_analysis(product: dict) -> dict:
    """Complete product analysis: prediction + reorder recommendation."""
    prediction = predict_demand(product)
    reorder = smart_reorder(product, prediction.get("predicted_demand"))
    
    return {
        "product": product["name"],
        "category": product["category"],
        "prediction": prediction,
        "reorder": reorder,
    }
