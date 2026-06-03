from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from backend.models.database import supabase
from backend.services.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserRegister):
    existing = supabase.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    hashed = hash_password(body.password)
    result = supabase.table("users").insert({"email": body.email, "hashed_password": hashed}).execute()
    return result.data[0]


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    result = supabase.table("users").select("*").eq("email", body.email).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = result.data[0]
    if not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_token(user["id"])
    return {"access_token": token, "token_type": "bearer"}
