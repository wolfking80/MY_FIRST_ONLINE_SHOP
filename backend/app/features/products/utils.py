import os
import uuid
from PIL import Image
from fastapi import UploadFile
from datetime import datetime

UPLOAD_DIR = "static/products"

def save_product_image(file: UploadFile) -> str:
    # Создаем структуру папок по дате: static/products/2024/05/
    date_path = datetime.now().strftime("%Y/%m")
    target_dir = os.path.join(UPLOAD_DIR, date_path)
    os.makedirs(target_dir, exist_ok=True)

    # Генерируем имя и путь
    filename = f"{uuid.uuid4()}.webp" # Сохраняем в формате webp (он весит в 3 раза меньше)
    file_path = os.path.join(target_dir, filename)

    # Сжимаем картинку через Pillow
    image = Image.open(file.file)
    # Оптимизируем размер (например, макс 1200px по ширине)
    image.thumbnail((1200, 1200))
    image.save(file_path, "WEBP", quality=80)

    # Возвращаем URL для базы данных
    return f"/static/products/{date_path}/{filename}"
