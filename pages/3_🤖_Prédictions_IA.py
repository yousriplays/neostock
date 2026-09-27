import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.predictor import predict_demand, full_analysis
from engine.seasons import get_active_events, get_seasonal_adjustment

st.set_page_config(page_title="Prédictions IA | SmartStock TN", page_icon="🤖", layout="wide")

def load_products():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "inventory.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)["products"]

if "products" not in st.session_state:
    st.session_state.products = load_products()
products = st.session_state.products

st.title("🤖 Prédictions IA")
st.caption("Prévision de demande alimentée par NVIDIA NIM, Gemini Flash et modèles statistiques")

# Architecture info
with st.expander("🔧 Architecture du moteur de prédiction", expanded=False):
    st.markdown("""
    **Chaîne de fallback à 4 couches :**
    1. 🟢 **NVIDIA NIM** (crédits Brev) — Modèle LLM avancé pour prédiction contextualisée
    2. 🔵 **Google Gemini Flash** — Backup gratuit, rapide et fiable
    3. 🟡 **Modèle Statistique** — Moyenne mobile pondérée + ajustement saisonnier (local)
    4. 🔴 **Règles de base** — Dernier mois + 10% de marge (toujours disponible)
    
    Chaque prédiction est validée par des gardes-fous (min/max basé sur l'historique).
    """)

st.divider()

# Mode selection
mode = st.radio(
    "Mode de prédiction",
    ["Produit unique", "Analyse complète (tous les produits)"],
    horizontal=True,
)

if mode == "Produit unique":
    selected = st.selectbox("Choisir un produit", [p["name"] for p in products])
    product = next(p for p in products if p["name"] == selected)
    
    # Show product context
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Stock actuel", f"{product['current_stock']} {product['unit']}")
    with col2:
        st.metric("Ventes moy./mois", f"{product['avg_monthly_sales']:.0f}")
    with col3:
        seasonal = get_seasonal_adjustment(product["category"])
        if seasonal["multiplier"] > 1:
            st.metric("Facteur saisonnier", f"×{seasonal['multiplier']}")
            st.caption(seasonal["reason"])
        else:
            st.metric("Facteur saisonnier", "×1.0 (normal)")
    
    st.divider()
    
    if st.button("🤖 Lancer la prédiction IA", type="primary", use_container_width=True):
        with st.spinner("Analyse en cours... Essai NVIDIA NIM → Gemini → Statistique..."):
            analysis = full_analysis(product)
        
        prediction = analysis["prediction"]
        reorder = analysis["reorder"]
        
        st.success(f"Prédiction terminée via {prediction.get('method_label', prediction.get('method', 'N/A'))}")
        
        # Prediction results
        st.subheader("📊 Résultats de la prédiction")
        
        col_a, col_b, col_c, col_d = st.columns(4)
        with col_a:
            st.metric(
                "📦 Demande prévue",
                f"{prediction['predicted_demand']} {product['unit']}",
                delta=f"{prediction['predicted_demand'] - product['avg_monthly_sales']:.0f} vs moyenne",
            )
        with col_b:
            conf_colors = {"élevé": "🟢", "moyen": "🟡", "faible": "🔴"}
            conf = prediction.get('confidence', 'moyen')
            st.metric("Confiance", f"{conf_colors.get(conf, '⚪')} {conf.title()}")
        with col_c:
            st.metric("Tendance", prediction.get('trend', 'stable').title())
        with col_d:
            st.metric("Latence", f"{prediction.get('latency_ms', 'N/A')} ms")
        
        st.info(f"💬 **Raisonnement :** {prediction.get('reasoning', 'N/A')}")
        
        if prediction.get("warning"):
            st.warning(f"⚠️ {prediction['warning']}")
        
        # Reorder recommendation
        st.divider()
        st.subheader("📦 Recommandation de réapprovisionnement")
        
        urgency_colors = {"critique": "🔴", "urgent": "🟠", "planifié": "🔵", "non_requis": "🟢"}
        urg = reorder["urgency"]
        
        if reorder["should_order"]:
            st.error(f"{urgency_colors.get(urg, '⚪')} **Commander maintenant : {reorder['recommended_qty']} {product['unit']}**")
        else:
            st.success(f"{urgency_colors.get(urg, '⚪')} Pas de commande urgente requise")
        
        col_r1, col_r2, col_r3, col_r4 = st.columns(4)
        with col_r1:
            st.metric("Quantité recommandée", f"{reorder['recommended_qty']} {product['unit']}")
        with col_r2:
            st.metric("Coût estimé", f"{reorder['estimated_cost_tnd']} TND")
        with col_r3:
            st.metric("Jours avant rupture", f"{reorder['days_until_stockout']:.0f} j")
        with col_r4:
            st.metric("EOQ optimal", f"{reorder['eoq']} {product['unit']}")
        
        st.caption(f"Fournisseur : {reorder['supplier']} | Délai : {reorder['lead_time_days']} jours | {reorder['note']}")
        
        # Comparison chart: actual vs predicted
        st.divider()
        st.subheader("📈 Historique vs Prédiction")
        
        hist_df = pd.DataFrame(product["sales_history"])
        # Add prediction point
        import datetime
        next_month = "2026-10"
        pred_row = pd.DataFrame([{"month": next_month, "sales": prediction["predicted_demand"], "type": "Prédiction"}])
        hist_df["type"] = "Historique"
        combined = pd.concat([hist_df[["month", "sales", "type"]], pred_row], ignore_index=True)
        
        fig = go.Figure()
        hist_data = combined[combined["type"] == "Historique"]
        pred_data = combined[combined["type"] == "Prédiction"]
        
        fig.add_trace(go.Scatter(
            x=hist_data["month"], y=hist_data["sales"],
            mode="lines+markers", name="Ventes réelles",
            line=dict(color="#3498db", width=2),
            marker=dict(size=8),
        ))
        fig.add_trace(go.Scatter(
            x=pred_data["month"], y=pred_data["sales"],
            mode="markers", name="Prédiction IA",
            marker=dict(color="#e74c3c", size=14, symbol="star"),
        ))
        # Connect last historical to prediction
        last_hist = hist_data.iloc[-1]
        fig.add_trace(go.Scatter(
            x=[last_hist["month"], next_month],
            y=[last_hist["sales"], prediction["predicted_demand"]],
            mode="lines", name="Projection",
            line=dict(color="#e74c3c", dash="dash", width=2),
            showlegend=False,
        ))
        
        fig.update_layout(
            title=f"Ventes historiques et prédiction — {product['name']}",
            xaxis_title="Mois", yaxis_title="Quantité",
            height=450,
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Method details
        with st.expander("🔍 Détails techniques"):
            st.json(prediction)

else:
    # Batch analysis
    st.subheader("📊 Analyse complète de l'inventaire")
    
    if st.button("🤖 Analyser tous les produits", type="primary", use_container_width=True):
        progress = st.progress(0, text="Analyse en cours...")
        results = []
        
        for i, product in enumerate(products):
            try:
                analysis = full_analysis(product)
                results.append(analysis)
            except Exception as e:
                st.warning(f"⚠️ Erreur pour {product['name']}: {e}")
            progress.progress((i + 1) / len(products), text=f"Analyse de {product['name']}...")
        
        progress.empty()
        st.success(f"✅ {len(results)} produits analysés")
        
        # Results table
        results_df = pd.DataFrame([{
            "Produit": r["product"],
            "Stock actuel": r["reorder"]["current_stock"],
            "Demande prévue": r["prediction"]["predicted_demand"],
            "Confiance": r["prediction"].get("confidence", "N/A"),
            "Urgence": r["reorder"]["urgency"],
            "Qté à commander": r["reorder"]["recommended_qty"] if r["reorder"]["should_order"] else 0,
            "Coût (TND)": r["reorder"]["estimated_cost_tnd"] if r["reorder"]["should_order"] else 0,
            "Méthode": r["prediction"].get("method", "N/A"),
        } for r in results])
        
        st.dataframe(results_df, use_container_width=True, height=500)
        
        # Total cost
        total_cost = results_df["Coût (TND)"].sum()
        orders_needed = (results_df["Qté à commander"] > 0).sum()
        st.metric("💰 Coût total de réapprovisionnement", f"{total_cost:,.0f} TND")
        st.metric("📦 Commandes à passer", f"{orders_needed}")
