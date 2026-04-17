from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import SECRET_KEY, ALGORITHM
from . import schemas, crud
from .models import User


# Создаём экземпляр, указывая URL эндпоинта для логина
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")


# Функция-фильтр, которая проверяет токен и «узнает» пользователя
async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
  ) -> User:
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id: str = payload.get("sub")
    if user_id is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception

  user = await crud.get_user_by_id(db, user_id=int(user_id))
  if user is None:
    raise credentials_exception
  
  return user


# Функция-фильтр для проверки статуса суперпользователя (администратора)
async def check_admin(current_user: User = Depends(get_current_user)) -> User:
  if not current_user.is_superuser:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN,
      detail="The user doesn't have enough privileges"
    )
  return current_user


# Проверка существования пользователя для GET | PATCH | DELETE
async def get_valid_user_by_id(user_id: int, db: AsyncSession = Depends(get_db)) -> User:
 user = await crud.get_user_by_id(db, user_id)
 if not user :
  raise HTTPException(
   status_code=status.HTTP_404_NOT_FOUND,
   detail=f"User with ID {user_id} not found"
  )
 return user


# Проверка уникальности при регистрации
async def validate_unique_user(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)) -> schemas.UserCreate:
  db_user = await crud.get_user_by_email_or_phone(db, user.email, user.phone)
  if db_user:
    if db_user.email==user.email:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Email already registered!"
      )
    
    if user.phone and db_user.phone==user.phone:
      raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This phone number is already using! "
      )
    
  return user 
