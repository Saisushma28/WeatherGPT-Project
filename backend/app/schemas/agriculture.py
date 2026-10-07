from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class CropAdvisoryRequest(BaseModel):
    crop: str = Field("rice", description="Crop name: rice, wheat, cotton, maize, groundnut, tomato, chili, sugarcane")
    goal: str = Field("irrigation", description="Goal: irrigation, sowing, spraying, harvesting, fertilizer")
    soil_type: Optional[str] = Field("clay_loam", description="Soil type: clay, clay_loam, sandy_loam, black_cotton, alluvial")
    crop_stage: Optional[str] = Field("vegetative", description="Crop stage: seedling, vegetative, flowering, maturity")
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    language: Optional[str] = "en"


class FarmingWindowDay(BaseModel):
    date: str
    day_name: str
    suitable: bool
    status: str  # Suitable, Caution, Unfavorable
    rain_probability: int
    rainfall_mm: float
    wind_speed_kmh: float
    temp_max: float
    temp_min: float
    advisory_notes: str


class CropAdvisoryResponse(BaseModel):
    crop: str
    goal: str
    recommendation: str  # Primary rule engine action
    action_type: str  # proceed, postpone, caution
    urgency: str  # low, medium, high
    reasoning: List[str]
    ai_explanation: str
    weather_summary: Dict[str, Any]
    farming_window: List[FarmingWindowDay]
    disclaimer: str = "Advisory only. Consult local Krishi Vigyan Kendra (KVK) or agricultural officers for critical decisions."
    language: str = "en"
