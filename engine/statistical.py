from engine.seasons import get_seasonal_adjustment, get_month_multiplier
from datetime import datetime


def moving_average(sales_history: list[dict], window: int = 3) -> float:
    """Calculate moving average from recent sales."""
    if not sales_history:
        return 0
    recent = [h["sales"] for h in sales_history[-window:]]
    return sum(recent) / len(recent)


def weighted_moving_average(sales_history: list[dict], weights: list[float] | None = None) -> float:
    """WMA giving more weight to recent months."""
    if not sales_history:
        return 0
    recent = [h["sales"] for h in sales_history[-3:]]
    if weights is None:
        weights = [0.2, 0.3, 0.5]  # Most recent gets highest weight
    if len(recent) < len(weights):
        weights = weights[-len(recent):]
    total = sum(s * w for s, w in zip(recent, weights))
    return total / sum(weights)


def predict_statistical(product: dict) -> dict:
    """Statistical prediction using WMA + seasonal adjustment."""
    history = product.get("sales_history", [])
    
    if not history:
        base = product.get("base_monthly_demand", 50)
    else:
        base = weighted_moving_average(history)
    
    # Apply seasonal adjustment
    seasonal = get_seasonal_adjustment(product["category"])
    adjusted = int(base * seasonal["multiplier"])
    
    # Detect trend
    if len(history) >= 3:
        early = sum(h["sales"] for h in history[:3]) / 3
        late = sum(h["sales"] for h in history[-3:]) / 3
        if late > early * 1.1:
            trend = "hausse"
            adjusted = int(adjusted * 1.05)
        elif late < early * 0.9:
            trend = "baisse"
            adjusted = int(adjusted * 0.95)
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    return {
        "predicted_demand": adjusted,
        "confidence": "moyen",
        "reasoning": f"Moyenne mobile pondérée ({base:.0f}) × facteur saisonnier ({seasonal['multiplier']}×). {seasonal['reason']}",
        "seasonal_factor": seasonal.get("event", "aucun") or "aucun",
        "trend": trend,
        "method": "statistical",
        "model": "WMA + saisonnier",
    }
