from fastapi import APIRouter, HTTPException
from app.schemas.agriculture import CropAdvisoryRequest, CropAdvisoryResponse
from app.services.agriculture_service import agriculture_service

router = APIRouter(prefix="/api/agriculture", tags=["agriculture"])


@router.post("/advisory", response_model=CropAdvisoryResponse)
async def get_crop_advisory(req: CropAdvisoryRequest):
    try:
        return await agriculture_service.get_crop_advisory(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate crop advisory: {str(e)}")
