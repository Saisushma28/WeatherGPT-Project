from fastapi import APIRouter, Query, HTTPException
from app.schemas.location import LocationSearchResponse
from app.providers.geocoding.geocoder import geocoding_service

router = APIRouter(prefix="/api/location", tags=["location"])


@router.get("/search", response_model=LocationSearchResponse)
async def search_location(
    q: str = Query(..., min_length=1, description="Location search query (e.g. Hyderabad, Vijayawada, Delhi)"),
    count: int = Query(5, ge=1, le=20)
):
    try:
        return await geocoding_service.search_location(query=q, count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location search failed: {str(e)}")
