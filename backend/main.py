from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import auth, products, ai, transactions, market

load_dotenv()

app = FastAPI(
    title="neostock API",
    description="Backend FastAPI for neostock (Tunisia AI Inventory)",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(market.router, prefix="/api/market", tags=["market"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "neostock API is running"}
