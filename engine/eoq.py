import math

def calculate_eoq(annual_demand: float, ordering_cost: float, holding_cost_per_unit: float) -> int:
    """Economic Order Quantity formula: Q* = sqrt(2DS/H)"""
    if annual_demand <= 0 or ordering_cost <= 0 or holding_cost_per_unit <= 0:
        return max(1, int(annual_demand / 12))
    eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
    return max(1, round(eoq))


def calculate_reorder_point(daily_demand: float, lead_time_days: int, safety_days: int = 3) -> int:
    """When to trigger a reorder."""
    return max(1, round(daily_demand * (lead_time_days + safety_days)))


def calculate_safety_stock(daily_demand: float, lead_time_days: int, z_score: float = 1.65) -> int:
    """Safety stock for 95% service level."""
    demand_std = daily_demand * 0.3  # Assume 30% CV
    return max(0, round(z_score * demand_std * math.sqrt(lead_time_days)))


def days_until_stockout(current_stock: int, daily_demand: float) -> float:
    """Estimate days until stock runs out."""
    if daily_demand <= 0:
        return float('inf')
    return round(current_stock / daily_demand, 1)


def smart_reorder(product: dict, predicted_demand: int | None = None) -> dict:
    """Complete reorder recommendation combining EOQ + AI prediction."""
    avg_monthly = product.get("avg_monthly_sales", product["base_monthly_demand"])
    annual = avg_monthly * 12
    daily = avg_monthly / 30
    
    holding_cost = product["base_price_tnd"] * product.get("holding_cost_ratio", 0.10)
    ordering_cost = product.get("ordering_cost_tnd", 15)
    
    eoq = calculate_eoq(annual, ordering_cost, holding_cost)
    reorder_pt = calculate_reorder_point(daily, product["supplier_lead_days"])
    safety = calculate_safety_stock(daily, product["supplier_lead_days"])
    stockout_days = days_until_stockout(product["current_stock"], daily)
    
    # If AI prediction provided, blend with EOQ
    if predicted_demand is not None:
        if predicted_demand > eoq * 3:
            recommended_qty = int(eoq * 2)
            confidence = "moyen"
            note = f"IA suggère {predicted_demand}, plafonné à 2× EOQ ({recommended_qty})"
        elif predicted_demand < eoq * 0.3:
            recommended_qty = int(eoq * 0.5)
            confidence = "moyen"
            note = f"IA suggère {predicted_demand}, relevé à 0.5× EOQ ({recommended_qty})"
        else:
            recommended_qty = predicted_demand
            confidence = "élevé"
            note = "IA et EOQ concordent"
    else:
        recommended_qty = eoq
        confidence = "moyen"
        note = "Basé sur la formule EOQ uniquement"
    
    should_order = product["current_stock"] <= reorder_pt
    urgency = "critique" if stockout_days <= product["supplier_lead_days"] else (
        "urgent" if product["current_stock"] <= reorder_pt else
        "planifié" if product["current_stock"] <= reorder_pt * 1.5 else
        "non_requis"
    )
    
    order_cost_tnd = round(recommended_qty * product["base_price_tnd"], 2)
    
    return {
        "product_name": product["name"],
        "should_order": should_order,
        "urgency": urgency,
        "recommended_qty": recommended_qty,
        "eoq": eoq,
        "reorder_point": reorder_pt,
        "safety_stock": safety,
        "current_stock": product["current_stock"],
        "days_until_stockout": stockout_days,
        "estimated_cost_tnd": order_cost_tnd,
        "confidence": confidence,
        "note": note,
        "supplier": product.get("supplier", "Non spécifié"),
        "lead_time_days": product["supplier_lead_days"],
    }
