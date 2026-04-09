from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List

from app.core.database import get_db
from . import crud, schemas
from .models import User


router = APIRouter(prefix="/users", tags=["users"])

@router.post(
      "/", response_model=schemas.UserOut, 
      status_code=status.HTTP_201_CREATED, 
      summary="New user registration")
async def create_user(new_user: schemas.UserCreate, db: AsyncSession = Depends(get_db)) -> User:
   return await crud.create_user(new_user, db)


@router.get("/", response_model=List[schemas.UserOut],summary="Get all users from database")
async def get_all_users(db: AsyncSession = Depends(get_db)) -> list[User]:
    return await crud.get_all_users(db)


@router.get("/{user_id}", response_model=schemas.UserOut,summary="Get user by ID")
async def get_user_by_id(user_id: int, db: AsyncSession=Depends(get_db)) -> User:
   return await crud.is_valid_user_id(user_id, db)


@router.patch("/{user_id}", response_model=schemas.UserOut,summary="Partial update user-data")
async def partial_update_user(user_id: int, update_data: schemas.UserUpdate,db: AsyncSession=Depends(get_db)) -> User:
   user = await crud.is_valid_user_id(user_id, db)
   return await crud.perform_update(update_data, db, user, partial=True)


@router.put("/{user_id}", response_model=schemas.UserOut,summary="Full update user-data")
async def full_update_user(user_id: int,update_data: schemas.UserUpdate,db: AsyncSession=Depends(get_db)) -> User:
   user = await crud.is_valid_user_id(user_id, db)
   return await crud.perform_update(update_data, db, user, partial=False)
   

@router.delete("/{user_id}", summary="Delete user by ID from database")
async def delete_user(user_id: int, db: AsyncSession=Depends(get_db)) -> dict:
   user = await crud.is_valid_user_id(user_id, db)
   await crud.delete_user(user, db)
   return  {"message": f"User {user_id} successfully deleted from DB!", "status": "success"}