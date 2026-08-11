import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List

from app.core.database import get_db
from . import crud, schemas
from .dependencies import (
    check_is_admin,
    check_is_staff,
    get_current_user,
    get_valid_user_by_id,
    validate_unique_user,
)
from .models import User

router = APIRouter(tags=["users"])


# Регистрация
@router.post(
    "/",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="New user registration",
)
async def create_user(
    new_user: schemas.UserCreate = Depends(validate_unique_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await crud.create_user(db, new_user)


# Идентификация: возвращает данные текущего авторизованного пользователя
@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


# Получение всех пользователей
@router.get(
    "/", response_model=List[schemas.UserOut], summary="Get all users from database"
)
async def get_all_users(
    db: AsyncSession = Depends(get_db), admin: User = Depends(check_is_staff)
) -> list[User]:
    return await crud.get_all_users(db)


# Получение пользователя по ID
@router.get("/{user_id}", response_model=schemas.UserOut, summary="Get user by ID")
async def get_user_by_id(user: User = Depends(get_valid_user_by_id)) -> User:
    return user


# Частичное обновление
@router.patch(
    "/{user_id}", response_model=schemas.UserOut, summary="Partial update user-data"
)
async def partial_update_user(
    update_data: schemas.UserUpdate,
    user: User = Depends(get_valid_user_by_id),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(check_is_admin),
) -> User:
    return await crud.perform_update(db, user, update_data, partial=True)


# Полное обновление
@router.put(
    "/{user_id}", response_model=schemas.UserOut, summary="Full update user-data"
)
async def full_update_user(
    update_data: schemas.UserUpdate,
    user: User = Depends(get_valid_user_by_id),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(check_is_admin),
) -> User:
    return await crud.perform_update(db, user, update_data, partial=False)


# Удаление пользователя
@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user by ID from database",
)
async def delete_user(
    user: User = Depends(get_valid_user_by_id),
    _: User = Depends(check_is_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    await crud.delete_user(db, user)
    return None


@router.put("/profile/update", status_code=200)
async def update_user_profile(
    payload: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Обновляем поля, превращая пустые строки "" в None (NULL в базе данных)
    # Это на 100% решает проблему с UniqueViolationError по телефону!
    if payload.first_name is not None:
        current_user.first_name = payload.first_name.strip() if payload.first_name.strip() else None
        
    if payload.last_name is not None:
        current_user.last_name = payload.last_name.strip() if payload.last_name.strip() else None
        
    if payload.phone is not None:
        current_user.phone = payload.phone.strip() if payload.phone.strip() else None
        
    if payload.city is not None:
        current_user.city = payload.city.strip() if payload.city.strip() else None

    # Фиксируем изменения в PostgreSQL
    await db.commit()
    
    # БЕЗОПАСНЫЙ ВЫВОД ДАТЫ: если это строка — отдаем как есть, если datetime — применяем .isoformat()
    if current_user.created_at:
        if isinstance(current_user.created_at, str):
            formatted_date = current_user.created_at
        else:
            formatted_date = current_user.created_at.isoformat()
    else:
        formatted_date = None

    return {
        "status": "success",
        "message": "Профиль успешно обновлен!",
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "first_name": current_user.first_name or "",
            "last_name": current_user.last_name or "",
            "phone": current_user.phone or "",
            "city": current_user.city or "",
            "role": current_user.role,
            "created_at": formatted_date
        },
    }


@router.post("/profile/avatar", status_code=200)
async def upload_user_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Защита: проверяем, что прилетел именно графический файл
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением (png, jpg, webp)!")

    # Создаем системную директорию для хранения аватарок, если её ещё нет
    # Путь будет вести в папку backend/static/avatars/
    UPLOAD_DIR = os.path.join("static", "avatars")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Генерируем уникальное имя файла через UUID, чтобы избежать совпадений
    file_extension = os.path.splitext(file.filename)[1] # Достаем расширение (например, .jpg)
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Читаем файл из памяти кусками и записываем на жесткий диск сервера
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при сохранении файла на сервере: {str(e)}")
    finally:
        await file.close()

    # Обновляем относительный путь в колонке avatar_url текущего пользователя
    # В базу пишем путь со слэшем в начале, например: /static/avatars/уникальный_ид.jpg
    relative_url = f"/{UPLOAD_DIR}/{unique_filename}".replace("\\", "/") # Защита от Windows-слэшей
    current_user.avatar_url = relative_url

    await db.commit()

    return {
        "status": "success",
        "message": "Аватар успешно обновлен!",
        "avatar_url": relative_url
    }
