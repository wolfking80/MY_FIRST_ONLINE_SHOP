import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime

# Общие поля для всех схем
class UserBase(BaseModel):
    email: EmailStr
    username: str | None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None

# Что ждем от React при регистрации (с паролем)
class UserCreate(UserBase):
    username: str
    password: str


# Для обновления
class UserUpdate(BaseModel):
# Не наследуемся от UserBase, чтобы сделать ВСЕ поля необязательными
# Это позволит пользователю поменять, например, только телефон, не присылая имя
    email: EmailStr | None = None
    password: str | None = None
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    city: str | None = None
    is_blocked: bool | None = None
    role: str | None = None
    
    
# Валидация Имени и Фамилии
    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, value: str | None) -> str | None:
        if value is None: return None
        cleaned = value.strip()
        if not cleaned: return None
        
        if not re.match(r"^[A-Za-zА-Яа-яЁё\s-]+$", cleaned):
            raise ValueError("Имя и Фамилия могут содержать только буквы, пробелы и дефис!")
        return cleaned

    # Валидация телефона
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if value is None: return None
        cleaned = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not cleaned: return None
        
        if not re.match(r"^(\+7|8)\d{10}$", cleaned):
            raise ValueError("Неверный формат телефона! Используйте: +79991112233 или 89990000000")
        return cleaned

    # Валидация города
    @field_validator("city")
    @classmethod
    def validate_city(cls, value: str | None) -> str | None:
        if value is None: return None
        cleaned = value.strip()
        if not cleaned: return None
        
        if len(cleaned) < 2:
            raise ValueError("Название города должно содержать не менее 2-х символов!")
        return cleaned    


# Что отдаем обратно в React
class UserOut(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    role: str
    is_blocked: bool
    
    
class UserShort(BaseModel):
    id: int
    username: str
    role: str    

    # Учим Pydantic общаться с БД
    # По умолчанию Pydantic умеет читать данные только из словарей (data["name"]).
    # А SQLAlchemy отдает данные как объекты (data.name).
    model_config = ConfigDict(from_attributes=True)


# Ответ сервера клиенту после успешного логина. 
# Клиент получает токен и должен отправлять его в следующих запросах.
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserShort


# Внутреннее представление данных, которые извлекаются из JWT токена после его проверки. 
# Не отправляется клиенту, используется внутри сервера
class TokenData(BaseModel):
    user_id: int | None = None