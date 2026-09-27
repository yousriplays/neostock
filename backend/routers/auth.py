from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt, JWTError

router = APIRouter()

SECRET_KEY = "super_secret_hackathon_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token: str
    token_type: str
    user: dict

DEMO_USERS = {
    "ahmed@epicerie.tn": {"password": "demo123", "name": "Ahmed", "role": "user"},
    "admin@smartstock.tn": {"password": "admin123", "name": "Admin", "role": "admin"}
}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
def login(req: LoginRequest):
    user = DEMO_USERS.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    user_info = {"email": req.email, "name": user["name"], "role": user["role"]}
    access_token = create_access_token(
        data={"sub": req.email, "name": user["name"], "role": user["role"]}
    )
    return {
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        return {"email": email, "name": payload.get("name"), "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

@router.get("/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
