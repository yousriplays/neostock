from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from typing import List, Optional

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "products.json")

class Product(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    buy_price_tnd: float
    sell_price_tnd: float
    current_stock: int
    min_stock: int
    max_stock: int
    supplier: str
    supplier_lead_days: int
    sales_history: List[int] = []
    months: List[str] = []

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"products": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@router.get("")
def get_products():
    data = load_data()
    return data.get("products", [])

@router.get("/alerts")
def get_alerts():
    data = load_data()
    alerts = []
    for p in data.get("products", []):
        if p["current_stock"] < p["min_stock"]:
            alerts.append(p)
    return alerts

@router.get("/stats")
def get_stats():
    data = load_data()
    products = data.get("products", [])
    total_products = len(products)
    total_value = sum(p["current_stock"] * p["buy_price_tnd"] for p in products)
    alerts_count = sum(1 for p in products if p["current_stock"] < p["min_stock"])
    return {
        "total_products": total_products,
        "total_value_tnd": round(total_value, 2),
        "alerts_count": alerts_count
    }

@router.get("/{product_id}")
def get_product(product_id: str):
    data = load_data()
    for p in data.get("products", []):
        if p["id"] == product_id:
            return p
    raise HTTPException(status_code=404, detail="Produit non trouvé")

@router.post("")
def add_product(product: Product):
    data = load_data()
    data.setdefault("products", []).append(product.dict())
    save_data(data)
    return product

@router.put("/{product_id}")
def update_product(product_id: str, updated_product: Product):
    data = load_data()
    for i, p in enumerate(data.get("products", [])):
        if p["id"] == product_id:
            data["products"][i] = updated_product.dict()
            save_data(data)
            return updated_product
    raise HTTPException(status_code=404, detail="Produit non trouvé")

@router.delete("/{product_id}")
def delete_product(product_id: str):
    data = load_data()
    products = data.get("products", [])
    data["products"] = [p for p in products if p["id"] != product_id]
    if len(data["products"]) == len(products):
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    save_data(data)
    return {"message": "Produit supprimé"}
