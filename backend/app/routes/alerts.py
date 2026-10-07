from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.schemas.alerts import AlertsResponse
from app.services.alert_service import alert_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=AlertsResponse)
async def get_alerts(
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    location_name: Optional[str] = Query(None, description="Location name")
):
    try:
        return await alert_service.get_alerts_for_location(latitude, longitude, location_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")
