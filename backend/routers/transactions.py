from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from typing import List, Optional

router = APIRouter()
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "products.json")

class Transaction(BaseModel):
    id: str
    date: str
    product_id: str
    type: str
    quantity: int
    unit_cost_tnd: float
    total_tnd: float
    supplier: Optional[str] = None
    status: str

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"transactions": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

@router.get("")
def get_transactions():
    data = load_data()
    return data.get("transactions", [])

@router.post("")
def add_transaction(transaction: Transaction):
    data = load_data()
    data.setdefault("transactions", []).append(transaction.dict())
    save_data(data)
    return transaction

@router.get("/summary")
def get_summary():
    data = load_data()
    transactions = data.get("transactions", [])
    total_spent = sum(t["total_tnd"] for t in transactions if t["type"] == "purchase")
    return {
        "total_spent_tnd": round(total_spent, 2),
        "transaction_count": len(transactions)
    }
