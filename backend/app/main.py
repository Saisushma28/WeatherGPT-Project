import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config.settings import settings
from app.routes import weather, location, chat, alerts, agriculture, voice, health
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="WeatherGPT: Production-quality conversational weather intelligence and decision-support platform."
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev and flexible testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(weather.router)
app.include_router(location.router)
app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(agriculture.router)
app.include_router(voice.router)
app.include_router(health.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to WeatherGPT API",
        "docs": "/docs",
        "health": "/api/health",
        "supported_languages": ["en", "hi", "te"],
        "version": settings.VERSION
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify parameters or retry.", "error": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
