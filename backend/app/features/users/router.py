from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List

from app.core.database import get_db
from . import crud, schemas
from .dependencies import check_admin, get_current_user, get_valid_user_by_id, validate_unique_user
from .models import User


router = APIRouter(prefix="/users", tags=["users"])


# Регистрация
@router.post(
      "/", response_model=schemas.UserOut, 
      status_code=status.HTTP_201_CREATED,
      summary="New user registration")
async def create_user(
   new_user: schemas.UserCreate = Depends(validate_unique_user),
   db: AsyncSession = Depends(get_db)) -> User:
   return await crud.create_user(db, new_user)


# Идентификация: возвращает данные текущего авторизованного пользователя
@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
   return current_user


# Получение всех пользователей
@router.get("/", response_model=List[schemas.UserOut], summary="Get all users from database")
async def get_all_users(
   db: AsyncSession = Depends(get_db),
   admin: User = Depends(check_admin)
   ) -> list[User]:
    return await crud.get_all_users(db)


# Получение пользователя по ID
@router.get("/{user_id}", response_model=schemas.UserOut, summary="Get user by ID")
async def get_user_by_id(user: User = Depends(get_valid_user_by_id)) -> User:
   return user


# Частичное обновление
@router.patch("/{user_id}", response_model=schemas.UserOut, summary="Partial update user-data")
async def partial_update_user(
   update_data: schemas.UserUpdate,
   user: User = Depends(get_valid_user_by_id),
   db: AsyncSession=Depends(get_db)
   ) -> User:
   return await crud.perform_update(db, user, update_data, partial=True)


# Полное обновление
@router.put("/{user_id}", response_model=schemas.UserOut, summary="Full update user-data")
async def full_update_user(
   update_data: schemas.UserUpdate,
   user: User = Depends(get_valid_user_by_id),
   db: AsyncSession=Depends(get_db)
   ) -> User:
   return await crud.perform_update(db, user, update_data, partial=False)
   

# Удаление пользователя
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete user by ID from database")
async def delete_user(
   user: User = Depends(get_valid_user_by_id),
   _: User = Depends(check_admin),
   db: AsyncSession=Depends(get_db)) -> None:
   await crud.delete_user(db, user)
   return None