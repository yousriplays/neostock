import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # NVIDIA NIM API endpoint
    NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL = "meta/llama-3.1-70b-instruct"
    
    # Gemini model
    GEMINI_MODEL = "gemini-2.0-flash"
    
    # App settings
    APP_NAME = "SmartStock TN"
    DEMO_MODE = True
    MAX_DEMO_PRODUCTS = 15
    
    @classmethod
    def has_nvidia(cls) -> bool:
        return bool(cls.NVIDIA_API_KEY and cls.NVIDIA_API_KEY.startswith("nvapi-"))
    
    @classmethod
    def has_gemini(cls) -> bool:
        return bool(cls.GEMINI_API_KEY)
    
    @classmethod
    def get_status(cls) -> dict:
        return {
            "nvidia": "✅ Connecté" if cls.has_nvidia() else "❌ Non configuré",
            "gemini": "✅ Connecté" if cls.has_gemini() else "❌ Non configuré",
        }
