from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

# Общие поля для всех схем
class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None

# Что ждем от React при регистрации (с паролем)
class UserCreate(UserBase):
    password: str


# Для обновления
class UserUpdate(BaseModel):
# Не наследуемся от UserBase, чтобы сделать ВСЕ поля необязательными
# Это позволит пользователю поменять, например, только телефон, не присылая имя
    email: EmailStr | None = None
    password: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None   


# Что отдаем обратно в React
class UserOut(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    # Учим Pydantic общаться с БД
    # По умолчанию Pydantic умеет читать данные только из словарей (data["name"]).
    # А SQLAlchemy отдает данные как объекты (data.name).
    model_config = ConfigDict(from_attributes=True)    