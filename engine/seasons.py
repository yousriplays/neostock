from datetime import datetime, timedelta

TUNISIA_EVENTS = {
    "ramadan_2026": {
        "name": "Ramadan 2026",
        "label": "🌙 Ramadan",
        "start": "2026-02-18",
        "end": "2026-03-20",
        "prep_weeks": 2,
        "categories": {
            "produits_laitiers": {"mult": 2.5, "raison": "Lben, lait pour ftour"},
            "céréales": {"mult": 3.0, "raison": "Couscous, semoule, pain"},
            "fruits": {"mult": 4.0, "raison": "Dattes Deglet Nour"},
            "condiments": {"mult": 2.0, "raison": "Harissa, concentré de tomate"},
            "boissons": {"mult": 1.5, "raison": "Jus, Boga pour ftour"},
            "confiserie": {"mult": 2.5, "raison": "Pâtisseries, chocolat"},
        }
    },
    "eid_fitr_2026": {
        "name": "Aïd el-Fitr 2026",
        "label": "🎉 Aïd el-Fitr",
        "start": "2026-03-20",
        "end": "2026-03-23",
        "prep_weeks": 1,
        "categories": {
            "fruits": {"mult": 2.0, "raison": "Pâtisseries, gâteaux"},
            "confiserie": {"mult": 3.0, "raison": "Cadeaux, friandises"},
            "hygiène": {"mult": 1.5, "raison": "Nettoyage, soins"},
        }
    },
    "été_2026": {
        "name": "Saison estivale",
        "label": "☀️ Été / Tourisme",
        "start": "2026-06-15",
        "end": "2026-09-15",
        "prep_weeks": 2,
        "categories": {
            "boissons": {"mult": 2.0, "raison": "Boissons fraîches en hausse"},
            "produits_laitiers": {"mult": 1.3, "raison": "Glaces, yaourts"},
            "hygiène": {"mult": 1.4, "raison": "Crème solaire, soins"},
        }
    },
    "rentrée_2026": {
        "name": "Rentrée scolaire",
        "label": "📚 Rentrée scolaire",
        "start": "2026-09-15",
        "end": "2026-10-05",
        "prep_weeks": 3,
        "categories": {
            "céréales": {"mult": 1.5, "raison": "Repas familiaux en hausse"},
            "conserves": {"mult": 1.4, "raison": "Préparation déjeuners"},
            "produits_laitiers": {"mult": 1.3, "raison": "Goûters enfants"},
        }
    },
}


def get_active_events(date: datetime | None = None) -> tuple[list[dict], list[dict]]:
    """Return (active_events, upcoming_events) for a given date."""
    if date is None:
        date = datetime.now()
    
    active = []
    upcoming = []
    
    for key, event in TUNISIA_EVENTS.items():
        start = datetime.strptime(event["start"], "%Y-%m-%d")
        end = datetime.strptime(event["end"], "%Y-%m-%d")
        prep_start = start - timedelta(weeks=event["prep_weeks"])
        
        if prep_start <= date <= end:
            active.append(event)
        elif date < prep_start and (prep_start - date).days <= 45:
            upcoming.append(event)
    
    return active, upcoming


def get_seasonal_adjustment(category: str, date: datetime | None = None) -> dict:
    """Get seasonal demand adjustment for a product category."""
    active, upcoming = get_active_events(date)
    
    max_mult = 1.0
    reason = "Pas d'événement saisonnier actif"
    event_name = None
    
    for event in active:
        cats = event.get("categories", {})
        if category in cats:
            info = cats[category]
            if info["mult"] > max_mult:
                max_mult = info["mult"]
                reason = f"{event['label']} — {info['raison']}"
                event_name = event["name"]
    
    return {
        "multiplier": max_mult,
        "reason": reason,
        "event": event_name,
        "active_events": [e["name"] for e in active],
        "upcoming_events": [e["name"] for e in upcoming],
    }


def get_month_multiplier(category: str, month: int) -> float:
    """Simple month-based multiplier for historical data generation."""
    MONTHLY = {
        "ramadan": {"months": [2, 3], "cats": {"produits_laitiers": 2.5, "céréales": 3.0, "fruits": 4.0, "condiments": 2.0, "boissons": 1.5, "confiserie": 2.5}},
        "été": {"months": [6, 7, 8], "cats": {"boissons": 2.0, "produits_laitiers": 1.3}},
        "rentrée": {"months": [9, 10], "cats": {"céréales": 1.5, "conserves": 1.4}},
        "hiver": {"months": [12, 1, 2], "cats": {"céréales": 1.3, "conserves": 1.2, "huiles": 1.2}},
    }
    max_m = 1.0
    for season in MONTHLY.values():
        if month in season["months"] and category in season["cats"]:
            max_m = max(max_m, season["cats"][category])
    return max_m
