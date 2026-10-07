from typing import Optional
from app.services.weather_service import weather_service
from app.schemas.alerts import AlertsResponse


class AlertService:
    async def get_alerts_for_location(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        return await weather_service.get_alerts(latitude, longitude, location_name)


alert_service = AlertService()
