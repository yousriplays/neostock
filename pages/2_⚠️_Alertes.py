import streamlit as st
import plotly.express as px
import pandas as pd
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from engine.eoq import days_until_stockout
from engine.seasons import get_active_events

st.set_page_config(page_title="Alertes | SmartStock TN", page_icon="⚠️", layout="wide")

def load_products():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "inventory.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)["products"]

if "products" not in st.session_state:
    st.session_state.products = load_products()
products = st.session_state.products

st.title("⚠️ Alertes de Stock")
st.caption("Produits nécessitant une attention immédiate")

# Seasonal context
active, upcoming = get_active_events()
if active:
    for event in active:
        st.warning(f"🌙 **Événement actif : {event['name']}** — La demande peut être significativement plus élevée pour certaines catégories.")
if upcoming:
    for event in upcoming:
        st.info(f"📅 **À venir : {event['name']}** — Préparez vos stocks en avance.")

st.divider()

# Separate by urgency
critiques = [p for p in products if p["stock_status"] == "critique"]
bas = [p for p in products if p["stock_status"] == "bas"]
normaux = [p for p in products if p["stock_status"] == "normal"]
bons = [p for p in products if p["stock_status"] == "bon"]

# Critical alerts
if critiques:
    st.subheader(f"🔴 Stock Critique ({len(critiques)} produits)")
    for p in critiques:
        daily = p["avg_monthly_sales"] / 30
        days_left = days_until_stockout(p["current_stock"], daily)
        with st.container(border=True):
            col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
            with col1:
                st.markdown(f"### 🚨 {p['name']}")
                st.caption(f"Catégorie : {p['category']} | Fournisseur : {p.get('supplier', 'N/A')}")
            with col2:
                st.metric("Stock", f"{p['current_stock']} {p['unit']}")
            with col3:
                st.metric("Jours restants", f"{days_left:.0f} j", delta=f"-{max(0, p['reorder_point'] - p['current_stock'])}", delta_color="inverse")
            with col4:
                st.metric("Seuil", f"{p['reorder_point']} {p['unit']}")
            
            if days_left <= p["supplier_lead_days"]:
                st.error(f"⚠️ **RUPTURE IMMINENTE** — Le stock sera épuisé avant la livraison (délai fournisseur : {p['supplier_lead_days']} jours)")
else:
    st.success("✅ Aucun produit en stock critique")

st.divider()

# Low stock alerts
if bas:
    st.subheader(f"🟠 Stock Bas ({len(bas)} produits)")
    for p in bas:
        daily = p["avg_monthly_sales"] / 30
        days_left = days_until_stockout(p["current_stock"], daily)
        with st.container(border=True):
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                st.markdown(f"**{p['name']}**")
                st.caption(f"Catégorie : {p['category']}")
            with col2:
                st.metric("Stock", f"{p['current_stock']} {p['unit']}")
            with col3:
                st.metric("Jours restants", f"{days_left:.0f} j")
else:
    st.info("✅ Aucun produit en stock bas")

st.divider()

# Summary chart
st.subheader("📊 Résumé des alertes")
alert_data = pd.DataFrame({
    "Statut": ["Critique", "Bas", "Normal", "Bon"],
    "Nombre": [len(critiques), len(bas), len(normaux), len(bons)],
})
fig = px.bar(
    alert_data, x="Statut", y="Nombre",
    color="Statut",
    color_discrete_map={"Critique": "#e74c3c", "Bas": "#f39c12", "Normal": "#27ae60", "Bon": "#2ecc71"},
    title="Distribution des statuts de stock",
)
fig.update_layout(showlegend=False, height=350)
st.plotly_chart(fig, use_container_width=True)

# Days until stockout chart
st.subheader("⏰ Jours avant rupture de stock")
stockout_data = []
for p in products:
    daily = p["avg_monthly_sales"] / 30
    days = days_until_stockout(p["current_stock"], daily)
    stockout_data.append({
        "Produit": p["name"],
        "Jours": min(days, 90),  # Cap at 90 for display
        "Statut": p["stock_status"],
    })
stockout_df = pd.DataFrame(stockout_data).sort_values("Jours")

fig2 = px.bar(
    stockout_df, x="Produit", y="Jours",
    color="Statut",
    color_discrete_map={"critique": "#e74c3c", "bas": "#f39c12", "normal": "#27ae60", "bon": "#2ecc71"},
    title="Estimation des jours avant rupture par produit",
)
fig2.add_hline(y=7, line_dash="dash", line_color="red", annotation_text="Zone de danger (7 jours)")
fig2.update_layout(xaxis_tickangle=-45, height=450)
st.plotly_chart(fig2, use_container_width=True)
