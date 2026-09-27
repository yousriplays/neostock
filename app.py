import streamlit as st
import json
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from utils.config import Config

# Page config
st.set_page_config(
    page_title="SmartStock TN 🇹🇳",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1a1a2e;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 0.5rem;
        color: white;
    }
    .status-critique { color: #e74c3c; font-weight: bold; }
    .status-bas { color: #f39c12; font-weight: bold; }
    .status-normal { color: #27ae60; }
    .status-bon { color: #2ecc71; }
    div[data-testid="stSidebarNav"] {padding-top: 1rem;}
</style>
""", unsafe_allow_html=True)


def load_inventory():
    """Load inventory data from JSON."""
    data_path = os.path.join(os.path.dirname(__file__), "data", "inventory.json")
    if not os.path.exists(data_path):
        # Generate data if not exists
        from data.generate_data import save_dataset
        save_dataset()
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load data into session state
if "inventory" not in st.session_state:
    st.session_state.inventory = load_inventory()
    st.session_state.products = st.session_state.inventory["products"]

products = st.session_state.products

# Sidebar
with st.sidebar:
    st.image("https://flagcdn.com/w80/tn.png", width=40)
    st.title("🏠 SmartStock TN")
    st.caption("Gestion intelligente de stock pour les commerces tunisiens")
    
    st.divider()
    
    # API Status
    st.subheader("🔗 Connexions IA")
    status = Config.get_status()
    for name, s in status.items():
        st.caption(f"{name.upper()}: {s}")
    
    st.divider()
    
    # Data info
    st.subheader("📊 Données")
    st.caption(f"📦 {len(products)} produits chargés")
    critiques = sum(1 for p in products if p["stock_status"] == "critique")
    bas = sum(1 for p in products if p["stock_status"] == "bas")
    if critiques > 0:
        st.caption(f"🔴 {critiques} en stock critique")
    if bas > 0:
        st.caption(f"🟠 {bas} en stock bas")
    
    st.divider()
    st.caption("🔒 Données 100% synthétiques")
    st.caption("Conforme à la loi tunisienne n° 2004-63")
    st.caption("v1.0 — Hackathon GOMYCODE 2026")


# Main page content
st.markdown("# 🏠 SmartStock TN 🇹🇳")
st.markdown("### Ne perdez plus jamais une vente à cause d'un rayon vide")
st.caption("Assistant IA de gestion de stock pour les commerces tunisiens")

st.divider()

# Key metrics
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="📦 Total Produits",
        value=len(products),
    )

with col2:
    critiques = sum(1 for p in products if p["stock_status"] == "critique")
    st.metric(
        label="🔴 Stock Critique",
        value=critiques,
        delta=f"{critiques} produits" if critiques > 0 else "Aucun",
        delta_color="inverse",
    )

with col3:
    bas = sum(1 for p in products if p["stock_status"] == "bas")
    st.metric(
        label="🟠 Stock Bas",
        value=bas,
        delta=f"{bas} produits" if bas > 0 else "Aucun",
        delta_color="inverse",
    )

with col4:
    total_value = sum(p["current_stock"] * p["base_price_tnd"] for p in products)
    st.metric(
        label="💰 Valeur Stock",
        value=f"{total_value:,.0f} TND",
    )

st.divider()

# Quick view table
st.subheader("📊 Vue d'ensemble de l'inventaire")

import pandas as pd

df = pd.DataFrame([{
    "Produit": p["name"],
    "Catégorie": p["category"],
    "Stock": p["current_stock"],
    "Unité": p["unit"],
    "Statut": p["stock_status"].upper(),
    "Ventes moy.": round(p["avg_monthly_sales"], 0),
    "Seuil réappro.": p["reorder_point"],
    "Prix (TND)": p["base_price_tnd"],
} for p in products])

# Color the status column
def color_status(val):
    colors = {
        "CRITIQUE": "background-color: #e74c3c; color: white; font-weight: bold",
        "BAS": "background-color: #f39c12; color: white; font-weight: bold",
        "NORMAL": "background-color: #27ae60; color: white",
        "BON": "background-color: #2ecc71; color: white",
    }
    return colors.get(val, "")

st.dataframe(
    df.style.map(color_status, subset=["Statut"]),
    use_container_width=True,
    height=400,
)

# Stock distribution chart
st.subheader("📊 Distribution des statuts de stock")

import plotly.express as px

status_counts = df["Statut"].value_counts().reset_index()
status_counts.columns = ["Statut", "Nombre"]
color_map = {"CRITIQUE": "#e74c3c", "BAS": "#f39c12", "NORMAL": "#27ae60", "BON": "#2ecc71"}

fig = px.pie(
    status_counts, values="Nombre", names="Statut",
    color="Statut", color_discrete_map=color_map,
    title="Répartition des produits par statut de stock",
    hole=0.4,
)
fig.update_traces(textposition='inside', textinfo='value+percent+label')
fig.update_layout(font=dict(size=14))
st.plotly_chart(fig, use_container_width=True)

# Footer
st.divider()
col_a, col_b = st.columns(2)
with col_a:
    st.markdown("""
    🤖 **Moteurs IA :** NVIDIA NIM (Brev) → Gemini Flash → Statistique → Règles  
    🛡️ **Données :** 100% synthétiques — aucune donnée personnelle  
    """)
with col_b:
    st.markdown("""
    🇹🇳 **Conçu pour la Tunisie** — Calendrier Ramadan, prix en TND  
    🏆 **Hackathon Come Build with AI** — GOMYCODE 2026  
    """)
