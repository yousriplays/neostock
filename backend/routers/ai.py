from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from services.ai_engine import (
    predict_demand,
    get_reorder_recommendation,
    analyze_inventory,
    generate_smart_alerts,
    chat_with_ai,
)

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "products.json")


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"products": [], "transactions": [], "seasonal_events": [], "market_knowledge": {}}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


class PredictRequest(BaseModel):
    product_id: str

class ChatRequest(BaseModel):
    message: str


@router.post("/predict")
def predict(req: PredictRequest):
    data = load_data()
    product = next((p for p in data.get("products", []) if p["id"] == req.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return predict_demand(product)


@router.post("/recommend")
def recommend(req: PredictRequest):
    data = load_data()
    product = next((p for p in data.get("products", []) if p["id"] == req.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return get_reorder_recommendation(product)


@router.post("/analyze")
def analyze():
    data = load_data()
    products = data.get("products", [])
    return analyze_inventory(products)


@router.post("/chat")
def chat(req: ChatRequest):
    data = load_data()
    products = data.get("products", [])
    context = {
        "sample_products": products,
        "market_knowledge": data.get("market_knowledge", {}),
        "seasonal_events": data.get("seasonal_events", []),
    }
    return chat_with_ai(req.message, context)


@router.get("/alerts")
def smart_alerts():
    data = load_data()
    products = data.get("products", [])
    alerts = generate_smart_alerts(products)
    return {"alerts": alerts, "total": len(alerts)}


@router.post("/full-report")
def full_report(req: PredictRequest):
    """Rapport complet pour un produit : prédiction + recommandation + alertes."""
    data = load_data()
    product = next((p for p in data.get("products", []) if p["id"] == req.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    prediction = predict_demand(product)
    recommendation = get_reorder_recommendation(product)

    return {
        "product": product,
        "prediction": prediction,
        "recommendation": recommendation,
    }


@router.get("/dashboard-stats")
def dashboard_stats():
    """Stats enrichies pour le tableau de bord avec scores de santé et ABC."""
    data = load_data()
    products = data.get("products", [])
    analysis = analyze_inventory(products)
    alerts = generate_smart_alerts(products)

    return {
        "analysis": analysis,
        "alerts": alerts,
        "alerts_count": len(alerts),
    }
