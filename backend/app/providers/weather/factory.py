from typing import Dict, Type
from app.providers.weather.base import BaseWeatherProvider
from app.providers.weather.open_meteo import OpenMeteoProvider
from app.providers.weather.openweather import OpenWeatherProvider
from app.providers.weather.weatherapi import WeatherAPIProvider
from app.config.settings import settings


class GFSProvider(BaseWeatherProvider):
    """
    Extension point for NOAA Global Forecast System (GFS) 0.25-degree GRIB2 / OpenDAP model feed.
    Designed for direct numerical weather prediction ingestion.
    """
    async def get_current_weather(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("GFS Numerical Model direct provider is registered as an extension point.")

    async def get_forecast(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("GFS Numerical Model direct provider is registered as an extension point.")

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name=None):
        raise NotImplementedError("GFS Archive is registered as an extension point.")

    async def get_alerts(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("GFS Alert model is registered as an extension point.")


class WRFProvider(BaseWeatherProvider):
    """
    Extension point for High-Resolution Weather Research and Forecasting (WRF) Meso-scale model.
    Designed for localized high-resolution domain simulation.
    """
    async def get_current_weather(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("WRF Meso-scale provider is registered as an extension point.")

    async def get_forecast(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("WRF Meso-scale provider is registered as an extension point.")

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name=None):
        raise NotImplementedError("WRF Re-analysis is registered as an extension point.")

    async def get_alerts(self, latitude: float, longitude: float, location_name=None):
        raise NotImplementedError("WRF Alert model is registered as an extension point.")


_PROVIDERS: Dict[str, Type[BaseWeatherProvider]] = {
    "open_meteo": OpenMeteoProvider,
    "openweather": OpenWeatherProvider,
    "weatherapi": WeatherAPIProvider,
    "gfs": GFSProvider,
    "wrf": WRFProvider
}


def get_weather_provider(provider_name: str = None) -> BaseWeatherProvider:
    name = (provider_name or settings.WEATHER_PROVIDER or "open_meteo").lower()
    provider_cls = _PROVIDERS.get(name)
    if not provider_cls:
        # Fallback safely to open_meteo
        return OpenMeteoProvider()
    return provider_cls()
