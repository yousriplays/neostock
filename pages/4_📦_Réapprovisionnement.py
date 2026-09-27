import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json
import os
import sys
import math

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.eoq import smart_reorder, calculate_eoq, days_until_stockout
from engine.seasons import get_seasonal_adjustment

st.set_page_config(page_title="Réapprovisionnement | SmartStock TN", page_icon="📦", layout="wide")

def load_products():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "inventory.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)["products"]

if "products" not in st.session_state:
    st.session_state.products = load_products()
products = st.session_state.products

st.title("📦 Réapprovisionnement Intelligent")
st.caption("Recommandations de commande basées sur EOQ et prédictions IA")

# EOQ explanation
with st.expander("📚 Comprendre la Quantité Économique de Commande (EOQ)", expanded=False):
    st.markdown(r"""
    La formule **EOQ** (Economic Order Quantity) minimise le coût total de commande + stockage :
    """)
    st.latex(r"Q^* = \sqrt{\frac{2DS}{H}}")
    st.markdown("""
    - **D** = Demande annuelle (unités/an)
    - **S** = Coût fixe par commande (livraison + temps)
    - **H** = Coût annuel de stockage par unité
    """)

st.divider()

# Generate all reorder recommendations
recommendations = []
for p in products:
    reorder = smart_reorder(p)
    seasonal = get_seasonal_adjustment(p["category"])
    recommendations.append({
        **reorder,
        "category": p["category"],
        "unit": p["unit"],
        "base_price": p["base_price_tnd"],
        "seasonal_mult": seasonal["multiplier"],
        "seasonal_reason": seasonal["reason"],
    })

# Filter by urgency
st.subheader("🚨 Commandes prioritaires")

critiques = [r for r in recommendations if r["urgency"] == "critique"]
urgents = [r for r in recommendations if r["urgency"] == "urgent"]
planifies = [r for r in recommendations if r["urgency"] == "planifié"]
non_requis = [r for r in recommendations if r["urgency"] == "non_requis"]

# Priority orders
for r in critiques + urgents:
    urgency_icon = "🔴" if r["urgency"] == "critique" else "🟠"
    with st.container(border=True):
        col1, col2, col3, col4, col5 = st.columns([3, 1, 1, 1, 1])
        with col1:
            st.markdown(f"### {urgency_icon} {r['product_name']}")
            st.caption(f"Fournisseur : {r['supplier']} | Délai : {r['lead_time_days']} jours")
            if r["seasonal_mult"] > 1:
                st.caption(f"🌙 {r['seasonal_reason']}")
        with col2:
            st.metric("Commander", f"{r['recommended_qty']} {r['unit']}")
        with col3:
            st.metric("Coût", f"{r['estimated_cost_tnd']} TND")
        with col4:
            st.metric("Rupture dans", f"{r['days_until_stockout']:.0f} j")
        with col5:
            st.metric("EOQ", f"{r['eoq']} {r['unit']}")
        
        st.caption(f"💬 {r['note']} | Confiance : {r['confidence']}")

if not critiques and not urgents:
    st.success("✅ Aucune commande urgente requise")

st.divider()

# Planned orders
if planifies:
    st.subheader(f"🔵 Commandes planifiées ({len(planifies)})")
    plan_df = pd.DataFrame([{
        "Produit": r["product_name"],
        "Qté recommandée": r["recommended_qty"],
        "Coût (TND)": r["estimated_cost_tnd"],
        "Jours avant rupture": f"{r['days_until_stockout']:.0f}",
        "Fournisseur": r["supplier"],
    } for r in planifies])
    st.dataframe(plan_df, use_container_width=True)

st.divider()

# Summary metrics
st.subheader("💰 Résumé financier")

total_urgent_cost = sum(r["estimated_cost_tnd"] for r in critiques + urgents)
total_planned_cost = sum(r["estimated_cost_tnd"] for r in planifies)

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("🔴 Commandes critiques", len(critiques))
with col2:
    st.metric("🟠 Commandes urgentes", len(urgents))
with col3:
    st.metric("💰 Coût urgent total", f"{total_urgent_cost:,.0f} TND")
with col4:
    st.metric("💰 Coût planifié total", f"{total_planned_cost:,.0f} TND")

# Cost breakdown chart
st.subheader("📊 Coût de réapprovisionnement par produit")

orders_with_cost = [r for r in recommendations if r["should_order"]]
if orders_with_cost:
    cost_df = pd.DataFrame([{
        "Produit": r["product_name"],
        "Coût (TND)": r["estimated_cost_tnd"],
        "Urgence": r["urgency"],
    } for r in orders_with_cost]).sort_values("Coût (TND)", ascending=True)
    
    color_map = {"critique": "#e74c3c", "urgent": "#f39c12", "planifié": "#3498db"}
    fig = px.bar(
        cost_df, x="Coût (TND)", y="Produit",
        color="Urgence", color_discrete_map=color_map,
        orientation="h",
        title="Budget de réapprovisionnement par produit",
    )
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("Aucune commande nécessaire pour le moment.")

# EOQ comparison
st.divider()
st.subheader("📊 Comparaison EOQ vs Stock actuel")

eoq_df = pd.DataFrame([{
    "Produit": r["product_name"],
    "Stock actuel": r["current_stock"],
    "Seuil réappro.": r["reorder_point"],
    "EOQ": r["eoq"],
    "Stock sécurité": r["safety_stock"],
} for r in recommendations])

fig2 = go.Figure()
fig2.add_trace(go.Bar(x=eoq_df["Produit"], y=eoq_df["Stock actuel"], name="Stock actuel", marker_color="#3498db"))
fig2.add_trace(go.Bar(x=eoq_df["Produit"], y=eoq_df["EOQ"], name="EOQ optimal", marker_color="#9b59b6"))
fig2.add_trace(go.Scatter(x=eoq_df["Produit"], y=eoq_df["Seuil réappro."], name="Seuil réappro.", mode="lines+markers", line=dict(color="red", dash="dash")))
fig2.update_layout(
    title="Stock actuel vs quantité optimale de commande",
    xaxis_tickangle=-45, height=500,
    barmode="group",
)
st.plotly_chart(fig2, use_container_width=True)
