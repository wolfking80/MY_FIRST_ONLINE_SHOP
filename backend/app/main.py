from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.features.users.router import router as users_router
from app.features.users.auth import router as auth_router



app = FastAPI(title="MY ONLINE SHOP",
              description="FastAPI + React = very cool application!",
              openapi_tags=[
                  {"name": "users", "description": "Users operations"},
                  {"name": "products", "description": "Products operations"}
              ])

# Разрешаем React (порт 3000) обращаться к нам
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ПОДКЛЮЧАЕМ РОУТЕР
# prefix="/users" значит, что все функции из users.py
# будут доступны по адрксу http://127.0.0
app.include_router(auth_router, prefix="/api/v1/users", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])

@app.get("/")
def read_root():
    return {"status": "Backend is alive!"}