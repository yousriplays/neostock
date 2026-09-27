import random
import json
import os
from datetime import datetime, timedelta

# Tunisian product catalog with realistic brands and prices
TUNISIAN_PRODUCTS = [
    {"name": "Harissa Le Phare du Cap Bon", "category": "condiments", "unit": "tube",
     "base_price_tnd": 2.8, "base_monthly_demand": 120, "supplier": "Société Le Phare", "supplier_lead_days": 3,
     "ordering_cost_tnd": 15, "holding_cost_ratio": 0.10},
    {"name": "Huile d'olive Carthage", "category": "huiles", "unit": "litre",
     "base_price_tnd": 18.5, "base_monthly_demand": 60, "supplier": "Huilerie Carthage", "supplier_lead_days": 5,
     "ordering_cost_tnd": 25, "holding_cost_ratio": 0.08},
    {"name": "Couscous Randa", "category": "céréales", "unit": "kg",
     "base_price_tnd": 3.2, "base_monthly_demand": 200, "supplier": "Randa SA", "supplier_lead_days": 2,
     "ordering_cost_tnd": 12, "holding_cost_ratio": 0.12},
    {"name": "Lait Vitalait", "category": "produits_laitiers", "unit": "litre",
     "base_price_tnd": 1.9, "base_monthly_demand": 350, "supplier": "Vitalait", "supplier_lead_days": 1,
     "ordering_cost_tnd": 10, "holding_cost_ratio": 0.15},
    {"name": "Dattes Deglet Nour", "category": "fruits", "unit": "kg",
     "base_price_tnd": 12.0, "base_monthly_demand": 40, "supplier": "Palmeraie du Djérid", "supplier_lead_days": 7,
     "ordering_cost_tnd": 30, "holding_cost_ratio": 0.06},
    {"name": "Thon El Manar", "category": "conserves", "unit": "boîte",
     "base_price_tnd": 4.5, "base_monthly_demand": 90, "supplier": "El Manar SA", "supplier_lead_days": 4,
     "ordering_cost_tnd": 18, "holding_cost_ratio": 0.08},
    {"name": "Boga Cidre", "category": "boissons", "unit": "bouteille",
     "base_price_tnd": 1.2, "base_monthly_demand": 250, "supplier": "SFBT", "supplier_lead_days": 2,
     "ordering_cost_tnd": 8, "holding_cost_ratio": 0.12},
    {"name": "Pâtes Warda", "category": "céréales", "unit": "paquet",
     "base_price_tnd": 2.1, "base_monthly_demand": 180, "supplier": "Pâtes Warda", "supplier_lead_days": 2,
     "ordering_cost_tnd": 10, "holding_cost_ratio": 0.10},
    {"name": "Café Bondin", "category": "boissons", "unit": "paquet",
     "base_price_tnd": 8.5, "base_monthly_demand": 70, "supplier": "Bondin", "supplier_lead_days": 5,
     "ordering_cost_tnd": 20, "holding_cost_ratio": 0.07},
    {"name": "Savon Lilas", "category": "hygiène", "unit": "unité",
     "base_price_tnd": 3.0, "base_monthly_demand": 55, "supplier": "Sotupa", "supplier_lead_days": 3,
     "ordering_cost_tnd": 12, "holding_cost_ratio": 0.10},
    {"name": "Tomate concentrée Cap Bon", "category": "condiments", "unit": "boîte",
     "base_price_tnd": 1.8, "base_monthly_demand": 150, "supplier": "Société Le Phare", "supplier_lead_days": 3,
     "ordering_cost_tnd": 10, "holding_cost_ratio": 0.12},
    {"name": "Eau Safia", "category": "boissons", "unit": "pack_6",
     "base_price_tnd": 3.5, "base_monthly_demand": 300, "supplier": "Safia", "supplier_lead_days": 1,
     "ordering_cost_tnd": 8, "holding_cost_ratio": 0.15},
    {"name": "Yaourt Délice", "category": "produits_laitiers", "unit": "pack_4",
     "base_price_tnd": 4.2, "base_monthly_demand": 100, "supplier": "Délice Danone", "supplier_lead_days": 1,
     "ordering_cost_tnd": 8, "holding_cost_ratio": 0.20},
    {"name": "Semoule Amor Benamor", "category": "céréales", "unit": "kg",
     "base_price_tnd": 2.5, "base_monthly_demand": 130, "supplier": "Amor Benamor", "supplier_lead_days": 3,
     "ordering_cost_tnd": 12, "holding_cost_ratio": 0.10},
    {"name": "Chocolat Gandour", "category": "confiserie", "unit": "tablette",
     "base_price_tnd": 5.0, "base_monthly_demand": 45, "supplier": "Gandour", "supplier_lead_days": 5,
     "ordering_cost_tnd": 15, "holding_cost_ratio": 0.08},
]

# Tunisian seasonal calendar
SEASONAL_CALENDAR = {
    "ramadan": {
        "months": [2, 3],  # Ramadan 2026 approx Feb-Mar
        "affected": {
            "produits_laitiers": 2.5, "céréales": 3.0, "fruits": 4.0,
            "condiments": 2.0, "boissons": 1.5, "confiserie": 2.5
        },
        "label": "🌙 Ramadan"
    },
    "eid_fitr": {
        "months": [3, 4],
        "affected": {"fruits": 2.0, "confiserie": 3.0, "hygiène": 1.5},
        "label": "🎉 Aïd el-Fitr"
    },
    "été_tourisme": {
        "months": [6, 7, 8],
        "affected": {"boissons": 2.0, "produits_laitiers": 1.3, "hygiène": 1.4},
        "label": "☀️ Été / Tourisme"
    },
    "rentrée_scolaire": {
        "months": [9, 10],
        "affected": {"céréales": 1.5, "conserves": 1.4, "produits_laitiers": 1.3},
        "label": "📚 Rentrée scolaire"
    },
    "hiver": {
        "months": [12, 1, 2],
        "affected": {"céréales": 1.3, "conserves": 1.2, "huiles": 1.2},
        "label": "❄️ Hiver"
    },
}


def get_seasonal_multiplier(category: str, month: int) -> tuple[float, str]:
    """Return (multiplier, reason) for a category in a given month."""
    max_mult = 1.0
    reason = "Demande normale"
    for season_key, season in SEASONAL_CALENDAR.items():
        if month in season["months"] and category in season["affected"]:
            mult = season["affected"][category]
            if mult > max_mult:
                max_mult = mult
                reason = f"{season['label']} — demande ×{mult}"
    return max_mult, reason


def generate_sales_history(product: dict, months: int = 12) -> list[dict]:
    """Generate realistic monthly sales history."""
    history = []
    today = datetime(2026, 9, 27)
    for m in range(months, 0, -1):
        date = today - timedelta(days=m * 30)
        month_num = date.month
        base = product["base_monthly_demand"]
        seasonal_mult, _ = get_seasonal_multiplier(product["category"], month_num)
        # Add realistic noise
        noise = random.uniform(0.82, 1.18)
        # Add a slight upward trend (growing business)
        trend = 1.0 + (months - m) * 0.005
        sales = max(1, int(base * seasonal_mult * noise * trend))
        history.append({
            "month": date.strftime("%Y-%m"),
            "month_num": month_num,
            "sales": sales,
            "seasonal_factor": round(seasonal_mult, 2)
        })
    return history


def generate_full_dataset() -> list[dict]:
    """Generate the complete synthetic dataset."""
    random.seed(42)  # Reproducible
    dataset = []
    
    for product in TUNISIAN_PRODUCTS:
        history = generate_sales_history(product)
        avg_sales = sum(h["sales"] for h in history) / len(history)
        
        # Some products critically low, some OK, some overstocked
        stock_scenarios = [
            (0.1, 0.3),  # Critical
            (0.3, 0.6),  # Low
            (0.6, 1.0),  # Normal
            (1.0, 1.5),  # Good
        ]
        low, high = random.choice(stock_scenarios)
        current_stock = max(1, int(avg_sales * random.uniform(low, high)))
        
        # Calculate reorder point
        daily_demand = avg_sales / 30
        safety_stock = int(daily_demand * 3)  # 3 days safety
        reorder_point = int(daily_demand * (product["supplier_lead_days"] + 3))
        
        # Determine stock status
        if current_stock <= reorder_point * 0.5:
            stock_status = "critique"
        elif current_stock <= reorder_point:
            stock_status = "bas"
        elif current_stock <= avg_sales * 1.2:
            stock_status = "normal"
        else:
            stock_status = "bon"
        
        dataset.append({
            **product,
            "current_stock": current_stock,
            "avg_monthly_sales": round(avg_sales, 1),
            "sales_history": history,
            "reorder_point": reorder_point,
            "safety_stock": safety_stock,
            "stock_status": stock_status,
            "last_updated": "2026-09-27T08:00:00",
        })
    
    return dataset


def save_dataset():
    """Generate and save the dataset."""
    data_dir = os.path.dirname(__file__)
    dataset = generate_full_dataset()
    
    filepath = os.path.join(data_dir, "seed_products.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    
    # Also save as the runtime inventory
    inv_path = os.path.join(data_dir, "inventory.json")
    with open(inv_path, "w", encoding="utf-8") as f:
        json.dump({"products": dataset, "generated_at": datetime.now().isoformat()}, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Données générées : {len(dataset)} produits tunisiens")
    print(f"   Fichier : {filepath}")
    
    # Print summary
    statuses = {}
    for p in dataset:
        s = p["stock_status"]
        statuses[s] = statuses.get(s, 0) + 1
    print(f"   Statuts : {statuses}")
    
    return dataset


if __name__ == "__main__":
    save_dataset()
