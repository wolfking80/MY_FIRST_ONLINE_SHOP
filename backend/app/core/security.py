from passlib.context import CryptContext

# Настройка алгоритма bcrypt
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def get_password_hash(password: str) -> str:
    # Превращаем пароль "12345" во что-то типа "$2b$12$R9h/cIPz..."
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Проверяем, подходит ли введенный пароль к хэшу из БД
    return pwd_context.verify(plain_password, hashed_password)