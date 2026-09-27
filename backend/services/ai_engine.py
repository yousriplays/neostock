import os
import json
import math
import httpx
from datetime import datetime
from dotenv import load_dotenv
from .eoq import calculate_eoq, calculate_reorder_point, days_until_stockout, calculate_safety_stock
from .seasons import get_current_season, get_seasonal_multiplier, get_upcoming_events

load_dotenv()

# ─── API CONFIGURATION (OpenRouter - Google Gemini 2.5 Flash) ─────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

SYSTEM_PROMPT = (
    "Tu es neostock IA, l'assistant d'élite en intelligence d'approvisionnement et gestion "
    "des stocks pour les commerçants, épiceries et superettes de Tunisie. "
    "Tu possèdes une expertise pointue du marché tunisien : "
    "marques locales (Harissa Le Phare du Cap Bon, Couscous Randa, Lait Vitalait, Boga Cidre, "
    "Huile d'olive Carthage, Dattes Deglet Nour, Café Bondin, Savon Lux), devises en Dinars Tunisiens (TND), "
    "pics saisonniers (Ramadan, été touristique, rentrée scolaire, Aïd el-Fitr/Kébir), "
    "et gestion des relations avec les grossistes et distributeurs locaux. "
    "Réponds toujours en français de manière claire, concise, professionnelle et directement actionnable."
)


# ─── APPEL OPENROUTER (Gemini 2.5 Flash) ──────────────────────────────────────
def _call_llm(prompt: str, system_override: str | None = None, max_tokens: int = 700) -> str | None:
    """Appelle Google Gemini 2.5 Flash via OpenRouter."""
    if not OPENROUTER_API_KEY:
        return None
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://smartstock.tn",
            "X-Title": "SmartStock TN",
        }
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_override or SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.35,
            "max_tokens": max_tokens
        }
        with httpx.Client(timeout=14.0) as client:
            r = client.post(OPENROUTER_ENDPOINT, headers=headers, json=payload)
            if r.status_code == 200:
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    return content.strip()
            else:
                print(f"[SmartStock LLM] OpenRouter returned status {r.status_code}: {r.text[:180]}")
    except Exception as e:
        print(f"[SmartStock LLM] Error calling OpenRouter: {e}")
    return None


# ═══════════════════════════════════════════════════════════════════════════════
#  ANALYSE STATISTIQUE EXPERTE
# ═══════════════════════════════════════════════════════════════════════════════

def _weighted_moving_average(history: list, weights: list | None = None) -> float:
    if not history:
        return 50.0
    n = min(len(history), 6)
    recent = history[-n:]
    if weights is None:
        weights = list(range(1, n + 1))
    w = weights[-n:]
    return sum(v * w_ for v, w_ in zip(recent, w)) / sum(w)


def _exponential_smoothing(history: list, alpha: float = 0.3) -> float:
    if not history:
        return 50.0
    forecast = history[0]
    for actual in history[1:]:
        forecast = alpha * actual + (1 - alpha) * forecast
    return forecast


def _trend_direction(history: list) -> dict:
    if len(history) < 4:
        return {"direction": "stable", "label": "Stable", "slope": 0.0}
    first_half = sum(history[:len(history)//2]) / max(len(history)//2, 1)
    second_half = sum(history[len(history)//2:]) / max(len(history) - len(history)//2, 1)
    pct = ((second_half - first_half) / max(first_half, 1)) * 100
    if pct > 10:
        return {"direction": "up", "label": "📈 Tendance haussière", "slope": round(pct, 1)}
    elif pct < -10:
        return {"direction": "down", "label": "📉 Tendance baissière", "slope": round(pct, 1)}
    return {"direction": "stable", "label": "➡️ Tendance stable", "slope": round(pct, 1)}


def _coefficient_of_variation(history: list) -> float:
    if len(history) < 2:
        return 0.0
    mean = sum(history) / len(history)
    if mean == 0:
        return 0.0
    variance = sum((x - mean) ** 2 for x in history) / len(history)
    return round((math.sqrt(variance) / mean) * 100, 1)


def _stock_turnover(annual_sales: float, avg_stock: float) -> float:
    if avg_stock <= 0:
        return 0.0
    return round(annual_sales / avg_stock, 2)


def _abc_classification(products: list) -> dict:
    items = []
    for p in products:
        annual = sum(p.get("sales_history", [0])) if p.get("sales_history") else 0
        value = annual * p.get("buy_price_tnd", 0)
        items.append({"id": p["id"], "name": p["name"], "annual_value": value})
    items.sort(key=lambda x: x["annual_value"], reverse=True)
    total_value = sum(i["annual_value"] for i in items) or 1
    cumulative = 0
    result = {}
    for item in items:
        cumulative += item["annual_value"]
        pct = (cumulative / total_value) * 100
        if pct <= 70:
            result[item["id"]] = "A"
        elif pct <= 90:
            result[item["id"]] = "B"
        else:
            result[item["id"]] = "C"
    return result


# ═══════════════════════════════════════════════════════════════════════════════
#  FONCTIONS PRINCIPALES (Gemini + Statistiques)
# ═══════════════════════════════════════════════════════════════════════════════

def predict_demand(product: dict) -> dict:
    history = product.get("sales_history", [])
    name = product.get("name", "Produit")
    category = product.get("category", "")
    current_month = datetime.now().month

    wma = _weighted_moving_average(history)
    ema = _exponential_smoothing(history, alpha=0.3)
    sma = sum(history[-3:]) / max(len(history[-3:]), 1) if history else 50
    multiplier = get_seasonal_multiplier(category, current_month)
    trend = _trend_direction(history)
    cv = _coefficient_of_variation(history)

    raw_pred = (wma * 0.45 + ema * 0.35 + sma * 0.20)
    predicted = max(1, round(raw_pred * multiplier))

    if cv < 15:
        confidence = 0.92
    elif cv < 30:
        confidence = 0.82
    else:
        confidence = 0.70

    season = get_current_season()
    events = [e["name"] for e in season.get("active_events", [])] if season.get("active_events") else ["Période standard"]

    # Appel Gemini 2.5 Flash pour l'analyse experte du marché
    llm_prompt = (
        f"Produit : {name} (Catégorie : {category}).\n"
        f"Historique récent des ventes (12 mois) : {history}.\n"
        f"Mois en cours : {current_month} | Événements actifs : {', '.join(events)}.\n"
        f"Prévision calculée : {predicted} unités (facteur saisonnier : {multiplier}x, "
        f"tendance : {trend['slope']:+.1f}%).\n\n"
        f"Rédige une analyse concise en 2 ou 3 phrases expliquant la dynamique de ce produit "
        f"sur le marché tunisien (habitudes d'achat locales, approvisionnement, anticipation)."
    )

    llm_insight = _call_llm(llm_prompt)
    if llm_insight:
        reasoning = llm_insight
        model_used = "Google Gemini 2.5 Flash"
    else:
        reasoning = (
            f"Prévision calculée par ensemble WMA ({round(wma)}) + EMA ({round(ema)}) + SMA ({round(sma)}), "
            f"ajustée au coefficient saisonnier {multiplier}x ({', '.join(events)}). "
            f"{trend['label']} ({trend['slope']:+.1f}%). Variabilité CV={cv}%."
        )
        model_used = "SmartStock Analytics Engine v2.0"

    return {
        "product_name": name,
        "predicted_demand": predicted,
        "confidence": confidence,
        "confidence_pct": f"{int(confidence * 100)}%",
        "reasoning": reasoning,
        "seasonal_factor": multiplier,
        "seasonal_events": events,
        "trend": trend,
        "variability_cv": cv,
        "methods": {
            "wma": round(wma),
            "ema": round(ema),
            "sma": round(sma),
            "ensemble_raw": round(raw_pred),
            "after_season": predicted
        },
        "model_used": model_used
    }


def get_reorder_recommendation(product: dict) -> dict:
    history = product.get("sales_history", [])
    name = product.get("name", "Produit")
    current_stock = product.get("current_stock", 0)
    min_stock = product.get("min_stock", 20)
    max_stock = product.get("max_stock", 200)
    buy_price = product.get("buy_price_tnd", 1.0)
    sell_price = product.get("sell_price_tnd", 1.5)
    lead_days = product.get("supplier_lead_days", 3)
    supplier = product.get("supplier", "Fournisseur")

    if history and len(history) >= 3:
        avg_monthly = sum(history[-3:]) / 3.0
    elif history:
        avg_monthly = sum(history) / len(history)
    else:
        avg_monthly = 30.0
    daily = max(avg_monthly / 30.0, 0.1)

    jours_rupture = current_stock / daily
    annual = daily * 365
    eoq = calculate_eoq(annual, ordering_cost=12.0, holding_cost=max(buy_price * 0.18, 0.2))
    rop = calculate_reorder_point(daily, lead_days, safety_days=3)
    safety = calculate_safety_stock(daily, lead_days, safety_days=3)

    if jours_rupture <= lead_days:
        status = "danger"
        status_label = "🔴 RISQUE DE RUPTURE"
        urgency = "CRITIQUE"
        message = (
            f"Le stock actuel ({current_stock} unités) ne couvre que {jours_rupture:.1f} jours, "
            f"ce qui est inférieur au délai fournisseur de {lead_days} jours. "
            f"Rupture inévitable sans réapprovisionnement immédiat auprès de {supplier} !"
        )
        should_order = True
    elif jours_rupture <= lead_days + 2:
        status = "warning"
        status_label = "🟠 ATTENTION"
        urgency = "MODÉRÉE"
        message = (
            f"Le stock de {name} couvre environ {jours_rupture:.1f} jours. "
            f"Il approche du délai fournisseur ({lead_days} jours). "
            f"Préparez un bon de commande sous 24 à 48 heures."
        )
        should_order = True
    else:
        status = "success"
        status_label = "🟢 STOCK SUFFISANT"
        urgency = "BASSE"
        message = (
            f"Le stock de {name} est sécurisé avec environ {jours_rupture:.1f} jours de couverture. "
            f"Aucune commande urgente nécessaire pour le moment."
        )
        should_order = False

    if should_order:
        qty = max(eoq, max_stock - current_stock, min_stock * 2 - current_stock)
        qty = max(int(qty), 1)
    else:
        qty = 0

    margin = ((sell_price - buy_price) / buy_price * 100) if buy_price > 0 else 0
    stock_value = current_stock * buy_price
    order_cost = qty * buy_price
    turnover = _stock_turnover(annual, current_stock) if current_stock > 0 else 0

    # Conseil IA Gemini 2.5 Flash pour le commerçant
    llm_review = None
    if should_order:
        llm_prompt = (
            f"Tu es le conseiller d'achat pour une épicerie en Tunisie.\n"
            f"Produit : {name} | Fournisseur : {supplier}\n"
            f"Stock actuel : {current_stock} (couverture : {jours_rupture:.1f} jours vs délai fournisseur : {lead_days} jours).\n"
            f"Commande recommandée : {qty} unités pour un budget de {order_cost:.2f} TND (marge : {margin:.1f}%).\n\n"
            f"Donne un avis concis (2-3 phrases percutantes) sur la démarche d'achat à effectuer "
            f"(négociation de volume, conditions de paiement, sécurisation de la livraison)."
        )
        llm_review = _call_llm(llm_prompt)

    return {
        "product_id": product.get("id"),
        "product_name": name,
        "supplier": supplier,
        "current_stock": current_stock,
        "min_stock": min_stock,
        "max_stock": max_stock,
        "daily_demand": round(daily, 1),
        "monthly_demand": round(avg_monthly),
        "jours_avant_rupture": round(jours_rupture, 1),
        "delai_fournisseur": lead_days,
        "status": status,
        "status_label": status_label,
        "urgency": urgency,
        "message": message,
        "should_order": should_order,
        "recommended_quantity": qty,
        "reorder_point": rop,
        "safety_stock": safety,
        "eoq": eoq,
        "estimated_cost_tnd": round(order_cost, 2),
        "stock_value_tnd": round(stock_value, 2),
        "margin_pct": round(margin, 1),
        "stock_turnover": turnover,
        "ai_review": llm_review,
        "model_used": "Google Gemini 2.5 Flash" if llm_review else "SmartStock Analytics Engine v2.0"
    }


def analyze_inventory(products: list) -> dict:
    total_val = sum(p.get("current_stock", 0) * p.get("buy_price_tnd", 0) for p in products)
    sell_val = sum(p.get("current_stock", 0) * p.get("sell_price_tnd", 0) for p in products)
    potential_margin = sell_val - total_val

    abc = _abc_classification(products)
    recs = []
    critical = 0
    warning = 0
    ok = 0
    total_order_cost = 0

    for p in products:
        rec = get_reorder_recommendation(p)
        rec["abc_class"] = abc.get(p["id"], "C")
        recs.append(rec)
        if rec["status"] == "danger":
            critical += 1
            total_order_cost += rec["estimated_cost_tnd"]
        elif rec["status"] == "warning":
            warning += 1
            total_order_cost += rec["estimated_cost_tnd"]
        else:
            ok += 1

    recs.sort(key=lambda r: {"danger": 0, "warning": 1, "success": 2}.get(r["status"], 3))

    total = len(products) or 1
    health_score = round(((ok * 100 + warning * 60 + critical * 10) / total), 0)

    summary_lines = []
    if critical > 0:
        summary_lines.append(f"🔴 {critical} produit(s) en risque critique de rupture immédiate.")
    if warning > 0:
        summary_lines.append(f"🟠 {warning} produit(s) nécessitent une commande préventive sous 48h.")
    if ok > 0:
        summary_lines.append(f"🟢 {ok} produit(s) ont un stock suffisant.")
    summary_lines.append(f"💰 Budget de réapprovisionnement urgent estimé : {round(total_order_cost, 2)} TND.")

    return {
        "total_products": len(products),
        "total_value_tnd": round(total_val, 2),
        "total_sell_value_tnd": round(sell_val, 2),
        "potential_margin_tnd": round(potential_margin, 2),
        "critical_count": critical,
        "warning_count": warning,
        "ok_count": ok,
        "health_score": health_score,
        "health_label": "🟢 Bon" if health_score >= 70 else ("🟠 À surveiller" if health_score >= 40 else "🔴 Critique"),
        "total_reorder_cost_tnd": round(total_order_cost, 2),
        "abc_summary": {
            "A": sum(1 for v in abc.values() if v == "A"),
            "B": sum(1 for v in abc.values() if v == "B"),
            "C": sum(1 for v in abc.values() if v == "C"),
        },
        "recommendations": recs,
        "summary": "\n".join(summary_lines),
        "model_used": "Google Gemini 2.5 Flash + SmartStock"
    }


def generate_smart_alerts(products: list) -> list:
    alerts = []
    season = get_current_season()

    for p in products:
        history = p.get("sales_history", [])
        daily = (sum(history[-3:]) / 3.0 / 30.0) if history and len(history) >= 3 else 2.0
        stock = p.get("current_stock", 0)
        lead = p.get("supplier_lead_days", 3)
        min_s = p.get("min_stock", 20)

        jours = stock / max(daily, 0.1)
        trend = _trend_direction(history)

        if jours <= lead:
            risk = "🔴"
            risk_level = "CRITICAL"
            priority = 0
            action = f"Commander immédiatement auprès de {p.get('supplier', 'votre fournisseur')}."
        elif jours <= lead + 2:
            risk = "🟠"
            risk_level = "WARNING"
            priority = 1
            action = f"Préparer un bon de commande sous 24-48h."
        elif stock < min_s:
            risk = "🟡"
            risk_level = "LOW"
            priority = 2
            action = f"Stock inférieur au seuil minimum ({min_s}). Planifier une commande."
        else:
            continue

        multiplier = get_seasonal_multiplier(p.get("category", ""), datetime.now().month)
        seasonal_note = ""
        if multiplier > 1.2:
            seasonal_note = f" ⚡ Coefficient saisonnier élevé ({multiplier}x) en cours."

        alerts.append({
            "product_id": p["id"],
            "product_name": p["name"],
            "risk": risk,
            "risk_level": risk_level,
            "priority": priority,
            "current_stock": stock,
            "days_until_stockout": round(jours, 1),
            "lead_days": lead,
            "daily_demand": round(daily, 1),
            "trend": trend["label"],
            "action": action + seasonal_note,
            "category": p.get("category", ""),
            "supplier": p.get("supplier", "")
        })

    alerts.sort(key=lambda a: (a["priority"], a["days_until_stockout"]))
    return alerts


def chat_with_ai(message: str, context: dict) -> dict:
    """Conversation RAG avec Gemini 2.5 Flash et contexte complet du magasin."""
    products = context.get("sample_products", [])
    market = context.get("market_knowledge", {})
    msg_lower = message.lower()

    # RAG : Sélection des produits pertinents
    matched = []
    for p in products:
        name_lower = p.get("name", "").lower()
        cat_lower = p.get("category", "").lower()
        supp_lower = p.get("supplier", "").lower()
        if any(w in name_lower or w in cat_lower or w in supp_lower for w in msg_lower.split() if len(w) > 2):
            rec = get_reorder_recommendation(p)
            matched.append({
                "id": p["id"],
                "nom": p["name"],
                "categorie": p.get("category", ""),
                "stock_actuel": p["current_stock"],
                "stock_min": p["min_stock"],
                "prix_achat_tnd": p["buy_price_tnd"],
                "prix_vente_tnd": p["sell_price_tnd"],
                "fournisseur": p.get("supplier", ""),
                "delai_livraison_jours": p.get("supplier_lead_days", 3),
                "jours_couverture": rec["jours_avant_rupture"],
                "statut": rec["status_label"],
                "quantite_recommandee": rec["recommended_quantity"]
            })

    # Si aucun mot clé précis n'est mentionné, inclure les 4 produits les plus critiques
    if not matched and products:
        critical_items = [p for p in products if p.get("current_stock", 0) <= p.get("min_stock", 20)]
        for p in (critical_items[:4] or products[:4]):
            rec = get_reorder_recommendation(p)
            matched.append({
                "nom": p["name"],
                "stock": p["current_stock"],
                "jours_couverture": rec["jours_avant_rupture"],
                "statut": rec["status_label"]
            })

    season_info = get_current_season()
    events_str = ", ".join([e["name"] for e in season_info.get("active_events", [])]) if season_info.get("active_events") else "Période standard"

    # Construction du prompt RAG avec tout le contexte
    llm_prompt = (
        f"Tu es l'assistant d'approvisionnement neostock IA.\n\n"
        f"--- CONTEXTE MAGASIN EN TEMPS RÉEL ---\n"
        f"• Événements saisonniers en Tunisie : {events_str}\n"
        f"• Nombre total de références en boutique : {len(products)}\n"
        f"• Données produits pertinentes extraites de la base :\n"
        f"{json.dumps(matched, ensure_ascii=False, indent=2)}\n"
        f"• Données de marché tunisien : {json.dumps(market, ensure_ascii=False)[:350]}\n\n"
        f"--- QUESTION DU COMMERÇANT ---\n"
        f"\"{message}\"\n\n"
        f"Réponds en français avec précision. Utilise des puces et du gras pour les chiffres importants. "
        f"Cite les produits pertinents, les montants en Dinars Tunisiens (TND), les délais fournisseurs, "
        f"et donne des conseils concrets orientés rentabilité et prévention des ruptures."
    )

    llm_response = _call_llm(llm_prompt)

    if llm_response:
        return {
            "response": llm_response,
            "sources": [
                "Google Gemini 2.5 Flash",
                "Base RAG neostock TN",
                "Calendrier Saisonnier Tunisien"
            ],
            "matched_products": len(matched),
            "model_used": "Google Gemini 2.5 Flash"
        }

    # Repli déterministe au besoin
    fallback = _generate_local_response(msg_lower, matched, products, season_info, market)
    return {
        "response": fallback,
        "sources": ["Moteur Expert neostock v2.0", "Calendrier Saisonnier TN"],
        "matched_products": len(matched),
        "model_used": "neostock Expert Engine v2.0"
    }


def _generate_local_response(msg: str, matched: list, all_products: list, season: dict, market: dict) -> str:
    if "ramadan" in msg:
        return (
            "🌙 **Préparation Ramadan — neostock**\n\n"
            "Durant le Ramadan, la demande tunisienne augmente considérablement :\n"
            "• **Dattes Deglet Nour** : coefficient x3.0\n"
            "• **Couscous & Semoule Randa** : coefficient x2.5\n"
            "• **Lait Vitalait** : coefficient x2.0\n"
            "• **Harissa Le Phare** : coefficient x2.5\n\n"
            "**Conseil :** Passez vos commandes au moins 15 jours à l'avance pour négocier des remises "
            "sur les volumes et éviter les pénuries chez les grossistes."
        )

    if matched:
        lines = ["📊 **Analyse de votre stock :**\n"]
        for m in matched[:4]:
            lines.append(f"• **{m.get('nom', 'Article')}** : {m.get('statut', '')} (Stock : {m.get('stock_actuel', m.get('stock', ''))})")
        return "\n".join(lines)

    return (
        "Je suis à votre disposition pour analyser vos niveaux de stock, calculer vos quantités économiques de commande "
        "(EOQ), et anticiper les pics de consommation sur le marché tunisien."
    )
