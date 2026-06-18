from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from typing import List

class ImageOut(BaseModel):
    url: str
    is_main: bool
    model_config = ConfigDict(from_attributes=True)

class BrandOut(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class ProductShort(BaseModel):
    id: int
    name: str
    slug: str
    base_price: Decimal
    average_rating: float
    brand: BrandOut | None
    images: List[ImageOut]
    total_stock: int = 0
    
    model_config = ConfigDict(from_attributes=True)