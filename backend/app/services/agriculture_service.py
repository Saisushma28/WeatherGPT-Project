from app.schemas.agriculture import CropAdvisoryRequest, CropAdvisoryResponse
from app.services.weather_service import weather_service
from app.rules.engine import evaluate_agricultural_rules


class AgricultureService:
    async def get_crop_advisory(self, req: CropAdvisoryRequest) -> CropAdvisoryResponse:
        # Retrieve actual forecast data for the farm coordinates
        forecast = await weather_service.get_forecast(
            latitude=req.latitude,
            longitude=req.longitude,
            location_name=req.location_name
        )

        # Run deterministic agricultural rule engine
        advisory = evaluate_agricultural_rules(
            crop=req.crop,
            goal=req.goal,
            soil_type=req.soil_type or "clay_loam",
            crop_stage=req.crop_stage or "vegetative",
            forecast=forecast,
            language=req.language or "en"
        )
        return advisory


agriculture_service = AgricultureService()
