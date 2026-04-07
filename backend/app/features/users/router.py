from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List

from app.core.database import get_db
from app.core.security import get_password_hash

from .models import User
from .schemas import UserCreate, UserOut


router = APIRouter()

@router.post("/", response_model=UserOut, summary="Регистрация нового пользователя")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Проверяем, нет ли уже такого email или телефона (асинхронно через select)
    # Это аналог SQL: SELECT * FROM users WHERE email = '...' OR phone = '...'
    query = select(User).where(or_(User.email==user.email, User.phone==user.phone))
    result= await db.execute(query)
    db_user = result.scalars().first()

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
    
    # Хэшируем пароль
    hashed_pass = get_password_hash(user.password)
    
    # Превращаем Pydantic-объект user (из React) в обычный Python-словарь
    # «ключ: значение»
    user_data = user.model_dump()

    # Удаляем из этого словаря чистый пароль
    user_data.pop("password")

    # Создаем объект для записи в БД, распаковываем словарь
    # и добавляем зашифрованный пароль
    new_user = User(**user_data, hashed_password=hashed_pass)

    # Сохраняем в БД
    db.add(new_user)
    # Ждем завершения транзакции
    await db.commit()
    # Подтягиваем ID и дату из БД
    await db.refresh(new_user)

    return new_user


@router.get("/", response_model=List[UserOut], summary="Получить всех пользователей")
async def get_all_users(db: AsyncSession = Depends(get_db)):
    query = select(User)
    result = await db.execute(query)
    return result.scalars().all()

