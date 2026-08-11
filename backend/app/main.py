from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.features import all_models
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import configure_mappers
from app.features.admin.router import router as admin_orders_router
from app.features.orders.router import router as orders_router
from app.features.products.router import router as products_router
from app.features.products.favorites_router import router as favorites_router
from app.features.users.router import router as users_router
from app.features.users.auth import router as auth_router
from app.features.carts.router import router as cart_router


# Принудительно связываем все отношения по именам
configure_mappers()


app = FastAPI(title="MY ONLINE SHOP",
              description="FastAPI + React = very cool application!",
              openapi_tags=[
                  {"name": "users", "description": "Users operations"},
                  {"name": "products", "description": "Products operations"}
              ])

# Разрешаем React (порт 5137) обращаться к нам
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5137", "http://127.0.0.1:5137"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ПОДКЛЮЧАЕМ РОУТЕР
# prefix="/users" значит, что все функции из users.py
# будут доступны по адресу http://127.0.0.1:8000
app.include_router(admin_orders_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(orders_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
# Подключаем каталог товаров
app.include_router(products_router, prefix="/api/v1/products", tags=["products"])
app.include_router(favorites_router, prefix="/api/v1")
app.include_router(cart_router, prefix="/api/v1")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"status": "Backend is alive!"}


# Глобальный перехватчик ошибок валидации Pydantic
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    # Достаем чистый текст ошибки из ValueError
    error_details = exc.errors()
    if error_details:
        error_msg = error_details[0].get("msg", "Ошибка валидации данных")
        # Убираем системную приставку Pydantic "Value error, " если она добавилась
        error_msg = error_msg.replace("Value error, ", "")
    else:
        error_msg = "Неверный формат заполнения полей"

    return JSONResponse(
        status_code=400,
        content={"detail": error_msg}
    )