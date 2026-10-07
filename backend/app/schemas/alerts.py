from typing import List, Optional
from pydantic import BaseModel, Field


class AlertItem(BaseModel):
    id: str
    alert_type: str = Field(..., description="e.g. Heavy Rainfall, Heatwave, Thunderstorm, Strong Wind, Cyclone")
    severity: str = Field(..., description="Extreme, Severe, Moderate, Minor or IMD Color (Red, Orange, Yellow, Green)")
    color: str = Field("yellow", description="green, yellow, orange, red")
    headline: str
    affected_location: str
    latitude: float
    longitude: float
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: str
    precautions: List[str] = Field(default_factory=list)
    source: str = "IMD Rule Engine / Meteorological Feed"
    is_active: bool = True


class AlertsResponse(BaseModel):
    location: str
    latitude: float
    longitude: float
    active_alerts_count: int
    alerts: List[AlertItem]
    source: str
    updated_at: str
