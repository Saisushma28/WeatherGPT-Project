from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query in English, Hindi, Telugu or another language")
    language: Optional[str] = Field("en", description="Language code: en, hi, te")
    latitude: Optional[float] = Field(None, description="Current user latitude")
    longitude: Optional[float] = Field(None, description="Current user longitude")
    location_name: Optional[str] = Field(None, description="Location name if known")
    goal: Optional[str] = Field("general", description="User persona/goal: general, farmer, traveler")


class ChatLocationInfo(BaseModel):
    name: str
    latitude: float
    longitude: float


class ChatResponse(BaseModel):
    answer: str
    language: str
    intent: str
    location: Optional[ChatLocationInfo] = None
    weather_data: Optional[Dict[str, Any]] = None
    sources: List[str] = Field(default_factory=lambda: ["Open-Meteo Weather Service"])
    disclaimer: Optional[str] = None
