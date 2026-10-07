from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class WeatherLocation(BaseModel):
    name: str = "Unknown Location"
    region: Optional[str] = None
    country: Optional[str] = "India"
    latitude: float
    longitude: float
    timezone: Optional[str] = "Asia/Kolkata"
    elevation: Optional[float] = None


class CurrentWeather(BaseModel):
    temperature: float = Field(..., description="Current temperature in Celsius")
    feels_like: float = Field(..., description="Apparent temperature in Celsius")
    condition: str = Field(..., description="Human readable weather condition")
    condition_code: int = Field(0, description="WMO or provider weather code")
    humidity: int = Field(..., description="Relative humidity in percentage (0-100)")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    wind_direction: int = Field(..., description="Wind direction in degrees (0-360)")
    wind_direction_cardinal: Optional[str] = Field(None, description="Wind direction cardinal (N, NE, E, etc.)")
    pressure: float = Field(..., description="Atmospheric pressure in hPa")
    visibility: float = Field(..., description="Visibility in km")
    rain_probability: int = Field(0, description="Precipitation probability (0-100%)")
    precipitation: float = Field(0.0, description="Precipitation in mm")
    uv_index: Optional[float] = Field(0.0, description="UV index")
    cloud_cover: Optional[int] = Field(0, description="Cloud cover percentage")
    sunrise: Optional[str] = Field(None, description="Sunrise ISO time or HH:MM")
    sunset: Optional[str] = Field(None, description="Sunset ISO time or HH:MM")
    is_day: int = Field(1, description="1 if daytime, 0 if nighttime")
    timestamp: str = Field(..., description="Timestamp of observation")
    source: str = Field("Open-Meteo", description="Data source provider name")
    location: WeatherLocation


class HourlyItem(BaseModel):
    time: str
    temperature: float
    feels_like: Optional[float] = None
    rain_probability: int
    precipitation: float = 0.0
    weather_condition: str
    weather_code: int
    wind_speed: float
    wind_direction: Optional[int] = None
    humidity: int


class DailyItem(BaseModel):
    date: str
    min_temperature: float
    max_temperature: float
    rain_probability: int
    precipitation_sum: float = 0.0
    weather_condition: str
    weather_code: int
    wind_speed_max: float
    uv_index_max: Optional[float] = None
    sunrise: Optional[str] = None
    sunset: Optional[str] = None


class ForecastResponse(BaseModel):
    location: WeatherLocation
    current: CurrentWeather
    hourly: List[HourlyItem]
    daily: List[DailyItem]
    source: str = "Open-Meteo"
    attribution: str = "Weather data provided by Open-Meteo / IMD model outputs"


class HistoricalDataPoint(BaseModel):
    date: str
    mean_temperature: float
    max_temperature: float
    min_temperature: float
    precipitation: float


class HistoricalResponse(BaseModel):
    location: WeatherLocation
    start_date: str
    end_date: str
    points: List[HistoricalDataPoint]
    average_temperature: float
    total_rainfall: float
    source: str
