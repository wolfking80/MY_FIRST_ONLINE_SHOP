from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException, status

from .models import User
from .schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash


# Вспомогательная функция-зависимость проверки существования пользователя в БД
async def is_valid_user_id(user_id: int, db: AsyncSession) -> User:
  query = select(User).where(User.id==user_id)
  result = await db.execute(query)
  user = result.scalars().first()

  if not user:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
  
  return user


# Создание пользователя (CREATE)
async def create_user(user: UserCreate, db: AsyncSession) -> User:
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


# Получить всех пользователей (GET)
async def get_all_users(db: AsyncSession) -> List[User]:
    query = select(User)
    result = await db.execute(query)
    return result.scalars().all()


# Обновление данных пользователя (UPDATE)
# Универсальная функция для полного и частичного обновления
# разница лишь во флаге partial (True - для PATCH, False - для PUT)
async def perform_update(
  update_data: UserUpdate,
  db: AsyncSession,
  user: User,
  partial: bool = True
) -> User:
# Если partial=True, берем только присланные поля. Если False — берем всё.к
  data = update_data.model_dump(exclude_unset=partial)
  
  # Прислал ли клиент поле password в JSON-запросе
  # и  присланное значение не является пустой строкой ("") или None
  # Достаем значение по ключу "password" и удаляем этот ключ из словаря data 
  if "password" in data and data["password"]:
     user.hashed_password = get_password_hash(data.pop("password"))
  # Обновляем объект пользователя
  for key, value in data.items():
     setattr(user, key, value)
  
  # Отправляем изменения в БД
  await db.commit()
  # Обновляем объект в памяти Python актуальными данными из базы
  await db.refresh(user)

  return user   
     

# Удалить пользователя по ID (DELETE)
async def delete_user(user: User, db: AsyncSession) -> None:
   await db.delete(user)
   await db.commit()