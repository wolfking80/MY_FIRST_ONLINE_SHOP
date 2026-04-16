from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from .models import User
from .schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash


# Поиск пользователя по ID (возвращаем None если не найден)
async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
  query = select(User).where(User.id==user_id)
  result = await db.execute(query)
  user = result.scalars().first()
  return user


# Поиск для проверки дубликатов или логина
async def get_user_by_email_or_phone(db: AsyncSession, email: str, phone: str | None) -> User | None:
  # Проверяем, нет ли уже такого email или телефона (асинхронно через select)
  # Это аналог SQL: SELECT * FROM users WHERE email = '...' OR phone = '...'
  # Динамически собираем условия, чтобы не искать по phone=None
  conditions = [User.email == email]
  if phone:
    conditions.append(User.phone == phone)
  query = select(User).where(or_(*conditions))
  result = await db.execute(query)
  return result.scalars().first()

# Создание пользователя (CREATE)
async def create_user(db: AsyncSession, user: UserCreate) -> User:
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


# Получить всех пользователей (GET) - с пагинацией, чтобы роутер не "лег", если пользователей очень много
async def get_all_users(db: AsyncSession, skip: int=0, limit: int=100) -> List[User]:
  query = select(User).offset(skip).limit(limit)
  result = await db.execute(query)
  return result.scalars().all()


# Обновление данных пользователя (UPDATE)
# Универсальная функция для полного и частичного обновления
# разница лишь во флаге partial (True - для PATCH, False - для PUT)
async def perform_update(
  db: AsyncSession,
  user: User,
  update_data: UserUpdate,
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
     # Защита от лишних полей в схеме
     if hasattr(user, key): 
       setattr(user, key, value)
  
  # Отправляем изменения в БД
  await db.commit()
  # Обновляем объект в памяти Python актуальными данными из базы
  await db.refresh(user)

  return user   
     

# Удалить пользователя по ID (DELETE)
async def delete_user(db: AsyncSession, user: User) -> None:
   await db.delete(user)
   await db.commit()