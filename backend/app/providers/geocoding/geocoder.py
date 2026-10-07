import httpx
from typing import List, Optional
from app.schemas.location import LocationSearchResult, LocationSearchResponse


class GeocodingService:
    """
    Geocoding service using Open-Meteo Geocoding API with Nominatim / OSM fallback.
    No private API key required.
    """
    GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

    def __init__(self):
        self.timeout = httpx.Timeout(8.0, connect=4.0)

    async def search_location(self, query: str, count: int = 5) -> LocationSearchResponse:
        q_cleaned = query.strip()
        if not q_cleaned:
            return LocationSearchResponse(query=query, results=[])

        # Step 1: Open-Meteo Geocoding
        results: List[LocationSearchResult] = []
        try:
            params = {
                "name": q_cleaned,
                "count": count,
                "language": "en",
                "format": "json"
            }
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.GEO_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_results = data.get("results", [])
                    for r in raw_results:
                        results.append(LocationSearchResult(
                            id=str(r.get("id", "")),
                            name=r.get("name", q_cleaned),
                            latitude=float(r.get("latitude")),
                            longitude=float(r.get("longitude")),
                            country=r.get("country"),
                            admin1=r.get("admin1"),
                            country_code=r.get("country_code"),
                            timezone=r.get("timezone", "Asia/Kolkata")
                        ))
        except Exception:
            pass

        # Step 2: Fallback to Nominatim if 0 results
        if not results:
            try:
                headers = {"User-Agent": "WeatherGPT/1.0 (weather intelligence)"}
                params = {"q": q_cleaned, "format": "json", "limit": count, "addressdetails": 1}
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(self.NOMINATIM_URL, params=params, headers=headers)
                    if resp.status_code == 200:
                        nom_data = resp.json()
                        for item in nom_data:
                            addr = item.get("address", {})
                            name = addr.get("city") or addr.get("town") or addr.get("state_district") or item.get("display_name", "").split(",")[0]
                            results.append(LocationSearchResult(
                                id=str(item.get("place_id", "")),
                                name=name,
                                latitude=float(item.get("lat")),
                                longitude=float(item.get("lon")),
                                country=addr.get("country"),
                                admin1=addr.get("state"),
                                country_code=addr.get("country_code", "").upper()
                            ))
            except Exception:
                pass

        return LocationSearchResponse(query=query, results=results)

    async def reverse_geocode(self, latitude: float, longitude: float) -> str:
        """Get human-readable city name from lat/lon."""
        try:
            headers = {"User-Agent": "WeatherGPT/1.0"}
            params = {"lat": latitude, "lon": longitude, "format": "json"}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(self.NOMINATIM_REVERSE_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    addr = data.get("address", {})
                    name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("state_district")
                    if name:
                        return f"{name}, {addr.get('state', '')}".strip(", ")
        except Exception:
            pass
        return f"Location ({latitude:.2f}, {longitude:.2f})"


geocoding_service = GeocodingService()
