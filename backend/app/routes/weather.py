from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.schemas.weather import CurrentWeather, ForecastResponse, HourlyItem, HistoricalResponse
from app.services.weather_service import weather_service

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("/current", response_model=CurrentWeather)
async def get_current_weather(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    location_name: Optional[str] = Query(None, description="Human readable location name")
):
    try:
        return await weather_service.get_current_weather(latitude, longitude, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch current weather: {str(e)}")


@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    location_name: Optional[str] = Query(None, description="Human readable location name")
):
    try:
        return await weather_service.get_forecast(latitude, longitude, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/hourly", response_model=List[HourlyItem])
async def get_hourly_forecast(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    location_name: Optional[str] = Query(None, description="Human readable location name")
):
    try:
        forecast = await weather_service.get_forecast(latitude, longitude, location_name)
        return forecast.hourly
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch hourly forecast: {str(e)}")


@router.get("/historical", response_model=HistoricalResponse)
async def get_historical_weather(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    location_name: Optional[str] = Query(None, description="Human readable location name")
):
    try:
        return await weather_service.get_historical_weather(latitude, longitude, start_date, end_date, location_name)
    except NotImplementedError:
        raise HTTPException(status_code=400, detail="Historical data unavailable for this source.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical weather: {str(e)}")
