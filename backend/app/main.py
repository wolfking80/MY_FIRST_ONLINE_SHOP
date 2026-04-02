from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import users
from app.core.database import engine, Base



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
    allow_methods=["*"],
    allow_headers=["*"],
)

# ПОДКЛЮЧАЕМ РОУТЕР
# prefix="/users" значит, что все функции из users.py
# будут доступны по адрксу http://127.0.0
app.include_router(users.router, prefix="/users", tags=["users"])

@app.get("/")
def read_root():
    return {"status": "Backend is alive!"}