from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from . import crud, schemas

router = APIRouter(prefix="/auth", tags=["auth"])


# Аутентификация: проверка пароля и выдача JWT-токена доступа
@router.post("/login", response_model=schemas.Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await crud.get_user_by_email_or_phone(db, email=form_data.username, phone=None)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    # Устанавливаем куку
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,  # JavaScript не сможет прочитать куку (Защита!) - Защита от XSS
        max_age=1800,   # 30 минут
        samesite="lax", # Защита от CSRF
        secure=False,   # Ставим True, когда будет HTTPS (на продакшене)
    )

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "message": "Successful login"
    }


# Выход из аккаунта
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False
    )
    return {"message": "Logged out"}