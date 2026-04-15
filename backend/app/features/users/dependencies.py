from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from . import schemas, crud
from .models import User


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
