from typing import Optional, List
from pydantic import BaseModel


class LocationSearchResult(BaseModel):
    id: Optional[str] = None
    name: str
    latitude: float
    longitude: float
    country: Optional[str] = None
    admin1: Optional[str] = None  # State / Province
    country_code: Optional[str] = None
    timezone: Optional[str] = None


class LocationSearchResponse(BaseModel):
    query: str
    results: List[LocationSearchResult]
