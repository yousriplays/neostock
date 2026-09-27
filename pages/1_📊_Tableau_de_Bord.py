import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

st.set_page_config(page_title="Tableau de Bord | SmartStock TN", page_icon="📊", layout="wide")

def load_products():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "inventory.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)["products"]

if "products" not in st.session_state:
    st.session_state.products = load_products()
products = st.session_state.products

st.title("📊 Tableau de Bord")
st.caption("Vue complète de votre inventaire et tendances de ventes")

# Filters
with st.sidebar:
    st.subheader("🔍 Filtres")
    categories = list(set(p["category"] for p in products))
    selected_cats = st.multiselect("Catégories", categories, default=categories)
    status_filter = st.multiselect("Statut stock", ["critique", "bas", "normal", "bon"], default=["critique", "bas", "normal", "bon"])

filtered = [p for p in products if p["category"] in selected_cats and p["stock_status"] in status_filter]

# Metrics row
col1, col2, col3, col4 = st.columns(4)
with col1:
    total_stock_value = sum(p["current_stock"] * p["base_price_tnd"] for p in filtered)
    st.metric("💰 Valeur totale stock", f"{total_stock_value:,.0f} TND")
with col2:
    avg_stock_ratio = sum(p["current_stock"] / max(1, p["avg_monthly_sales"]) for p in filtered) / max(1, len(filtered))
    st.metric("📅 Couverture moyenne", f"{avg_stock_ratio:.1f} mois")
with col3:
    urgent_orders = sum(1 for p in filtered if p["current_stock"] <= p["reorder_point"])
    st.metric("🚨 Commandes urgentes", urgent_orders)
with col4:
    total_products = len(filtered)
    st.metric("📦 Produits affichés", total_products)

st.divider()

# Stock levels bar chart
st.subheader("📊 Niveaux de stock par produit")
df = pd.DataFrame([{
    "Produit": p["name"].split(" ")[0],  # Short name
    "Stock actuel": p["current_stock"],
    "Seuil réappro.": p["reorder_point"],
    "Statut": p["stock_status"],
    "Full Name": p["name"],
} for p in filtered])

color_map = {"critique": "#e74c3c", "bas": "#f39c12", "normal": "#27ae60", "bon": "#2ecc71"}

fig = go.Figure()
fig.add_trace(go.Bar(
    x=df["Full Name"], y=df["Stock actuel"],
    name="Stock actuel",
    marker_color=[color_map.get(s, "#3498db") for s in df["Statut"]],
    text=df["Stock actuel"],
    textposition="auto",
))
fig.add_trace(go.Scatter(
    x=df["Full Name"], y=df["Seuil réappro."],
    name="Seuil de réapprovisionnement",
    mode="lines+markers",
    line=dict(color="red", dash="dash", width=2),
    marker=dict(size=8),
))
fig.update_layout(
    title="Stock actuel vs seuil de réapprovisionnement",
    xaxis_title="Produit",
    yaxis_title="Quantité",
    xaxis_tickangle=-45,
    height=500,
    legend=dict(yanchor="top", y=0.99, xanchor="right", x=0.99),
)
st.plotly_chart(fig, use_container_width=True)

st.divider()

# Sales trend chart
st.subheader("📈 Tendances de ventes (12 derniers mois)")
selected_product = st.selectbox("Choisir un produit", [p["name"] for p in filtered])
prod = next(p for p in filtered if p["name"] == selected_product)

history_df = pd.DataFrame(prod["sales_history"])
fig2 = px.line(
    history_df, x="month", y="sales",
    title=f"Historique des ventes — {prod['name']}",
    markers=True,
    labels={"month": "Mois", "sales": "Ventes"},
)

# Add seasonal factor as bar
if "seasonal_factor" in history_df.columns:
    fig2.add_trace(go.Bar(
        x=history_df["month"],
        y=history_df["seasonal_factor"] * max(history_df["sales"]) / 5,
        name="Facteur saisonnier",
        opacity=0.3,
        marker_color="orange",
        yaxis="y2",
    ))
    fig2.update_layout(
        yaxis2=dict(title="Facteur saisonnier", overlaying="y", side="right", range=[0, 5]),
    )

fig2.update_layout(height=400)
st.plotly_chart(fig2, use_container_width=True)

# Product details
col_a, col_b, col_c = st.columns(3)
with col_a:
    st.metric("Stock actuel", f"{prod['current_stock']} {prod['unit']}")
    st.metric("Prix unitaire", f"{prod['base_price_tnd']} TND")
with col_b:
    st.metric("Ventes moy./mois", f"{prod['avg_monthly_sales']:.0f}")
    st.metric("Délai fournisseur", f"{prod['supplier_lead_days']} jours")
with col_c:
    st.metric("Seuil réappro.", f"{prod['reorder_point']} {prod['unit']}")
    st.metric("Fournisseur", prod.get("supplier", "N/A"))

# Category breakdown
st.divider()
st.subheader("📊 Répartition par catégorie")
cat_df = pd.DataFrame([{
    "Catégorie": p["category"].replace("_", " ").title(),
    "Valeur (TND)": round(p["current_stock"] * p["base_price_tnd"], 2),
} for p in filtered])
cat_summary = cat_df.groupby("Catégorie")["Valeur (TND)"].sum().reset_index()

fig3 = px.bar(
    cat_summary, x="Catégorie", y="Valeur (TND)",
    title="Valeur du stock par catégorie",
    color="Valeur (TND)",
    color_continuous_scale="Viridis",
)
fig3.update_layout(height=400)
st.plotly_chart(fig3, use_container_width=True)
