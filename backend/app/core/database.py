import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Берем из .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Создаем асинхронный движок
engine = create_async_engine(DATABASE_URL, echo=True)
# Фабрика асинхронных сессий
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
    )

Base = declarative_base()

# Асинхронный генератор сессий
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session