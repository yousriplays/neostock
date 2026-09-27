from datetime import datetime

TUNISIA_SEASONS = [
    {
        "name": "Ramadan",
        "typical_months": [1, 2, 3],
        "affected_categories": ["dairy", "grains", "fruits", "condiments", "beverages"],
        "demand_multiplier": 2.5,
        "description": "Forte hausse de la demande en produits alimentaires de base"
    },
    {
        "name": "Été / Tourisme",
        "typical_months": [6, 7, 8],
        "affected_categories": ["beverages", "dairy", "hygiene"],
        "demand_multiplier": 1.8,
        "description": "Saison touristique, hausse des boissons et produits frais"
    },
    {
        "name": "Rentrée Scolaire",
        "typical_months": [9],
        "affected_categories": ["grains", "canned", "dairy"],
        "demand_multiplier": 1.4,
        "description": "Reprise des achats familiaux après les vacances"
    },
    {
        "name": "Aïd el-Fitr",
        "typical_months": [3, 4],
        "affected_categories": ["fruits", "condiments", "hygiene"],
        "demand_multiplier": 2.0,
        "description": "Fête de fin de Ramadan, achats de sucreries et cadeaux"
    }
]

def get_current_season():
    current_month = datetime.now().month
    active_events = []
    multipliers = []
    for season in TUNISIA_SEASONS:
        if current_month in season["typical_months"]:
            active_events.append(season)
            multipliers.append(season["demand_multiplier"])
    
    return {
        "active_events": active_events,
        "multipliers": multipliers
    }

def get_seasonal_multiplier(category: str, month: int) -> float:
    multiplier = 1.0
    for season in TUNISIA_SEASONS:
        if month in season["typical_months"] and category in season["affected_categories"]:
            multiplier = max(multiplier, season["demand_multiplier"])
    return multiplier

def get_upcoming_events():
    current_month = datetime.now().month
    next_month = (current_month % 12) + 1
    upcoming = []
    for season in TUNISIA_SEASONS:
        if next_month in season["typical_months"] or current_month in season["typical_months"]:
            upcoming.append(season)
    return upcoming
