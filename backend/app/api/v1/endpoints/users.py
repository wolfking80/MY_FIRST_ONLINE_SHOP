from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import get_password_hash


router = APIRouter()

@router.post("/", response_model=UserOut, summary="Регистрация нового пользователя")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Проверяем, нет ли уже такого email (асинхронно через select)
    # Это аналог SQL: SELECT * FROM users WHERE email = '...'
    query = select(User).where(User.email==user.email)
    result= await db.execute(query)
    db_user = result.scalars().first()

    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered!"
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

