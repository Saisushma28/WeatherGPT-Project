import re
from typing import Dict, Any, Optional
from app.schemas.chat import ChatRequest, ChatResponse, ChatLocationInfo
from app.providers.llm.factory import get_llm_provider
from app.providers.geocoding.geocoder import geocoding_service
from app.services.weather_service import weather_service
from app.services.alert_service import alert_service
from app.rules.engine import evaluate_agricultural_rules


class ChatService:
    # Default coordinates: Hyderabad, Telangana (17.3850, 78.4867)
    DEFAULT_LAT = 17.3850
    DEFAULT_LON = 78.4867
    DEFAULT_CITY = "Hyderabad"

    async def process_chat(self, req: ChatRequest) -> ChatResponse:
        llm = get_llm_provider()

        # Step 1: Query analysis (Language, Intent, Location, Date, Parameter, Goal)
        extracted = await llm.extract_intent_and_entities(req.message)

        # Merge with explicitly requested language or goal from request
        lang = req.language or extracted.get("language") or "en"
        # Auto-detect Telugu or Hindi if message has native script
        if re.search(r'[\u0C00-\u0C7F]', req.message):
            lang = "te"
        elif re.search(r'[\u0900-\u097F]', req.message):
            lang = "hi"

        goal = req.goal or extracted.get("goal") or "general"
        intent = extracted.get("intent", "current_weather")
        extracted_loc = extracted.get("location")
        date_ref = extracted.get("date", "today")

        # Step 2: Location resolution
        target_lat = req.latitude
        target_lon = req.longitude
        location_name = req.location_name or self.DEFAULT_CITY

        # If query specifies a different city (e.g. "Will it rain in Hyderabad?"), resolve it!
        if extracted_loc:
            geo_res = await geocoding_service.search_location(extracted_loc, count=1)
            if geo_res.results:
                target_lat = geo_res.results[0].latitude
                target_lon = geo_res.results[0].longitude
                location_name = geo_res.results[0].name

        # Fallback to default if coordinates still missing
        if target_lat is None or target_lon is None:
            target_lat = self.DEFAULT_LAT
            target_lon = self.DEFAULT_LON
            location_name = self.DEFAULT_CITY

        # Step 3: Meteorological Data Retrieval
        forecast = await weather_service.get_forecast(
            latitude=target_lat,
            longitude=target_lon,
            location_name=location_name
        )

        curr = forecast.current
        daily = forecast.daily
        hourly = forecast.hourly

        # Target parameters based on date reference
        if date_ref == "tomorrow" and len(daily) > 1:
            target_day = daily[1]
            weather_payload = {
                "date": "tomorrow",
                "condition": target_day.weather_condition,
                "temperature_max": target_day.max_temperature,
                "temperature_min": target_day.min_temperature,
                "rain_probability": target_day.rain_probability,
                "precipitation_sum": target_day.precipitation_sum,
                "wind_speed_max": target_day.wind_speed_max,
                "uv_index_max": target_day.uv_index_max
            }
        else:
            weather_payload = {
                "date": "today",
                "condition": curr.condition,
                "temperature": curr.temperature,
                "feels_like": curr.feels_like,
                "humidity": curr.humidity,
                "wind_speed": curr.wind_speed,
                "wind_direction": curr.wind_direction_cardinal,
                "rain_probability": curr.rain_probability,
                "precipitation": curr.precipitation,
                "pressure": curr.pressure,
                "visibility": curr.visibility,
                "uv_index": curr.uv_index,
                "sunrise": curr.sunrise,
                "sunset": curr.sunset
            }

        # Step 4: Context preparation for persona / goal
        context_data = {
            "query": req.message,
            "intent": intent,
            "date": date_ref,
            "goal": goal,
            "language": lang,
            "location": {
                "name": location_name,
                "latitude": target_lat,
                "longitude": target_lon
            },
            "current": weather_payload
        }

        # If goal is farmer or agricultural intent, run rule engine
        agri_advisory = None
        if goal == "farmer" or intent == "agriculture":
            crop = "rice"
            for c in ["wheat", "cotton", "maize", "groundnut", "tomato", "chili", "sugarcane"]:
                if c in req.message.lower():
                    crop = c
                    break
            agri_res = evaluate_agricultural_rules(
                crop=crop,
                goal="irrigation" if "irrigat" in req.message.lower() else "spraying" if "spray" in req.message.lower() else "sowing",
                soil_type="clay_loam",
                crop_stage="vegetative",
                forecast=forecast,
                language=lang
            )
            context_data["agricultural_rule_recommendation"] = agri_res.recommendation
            context_data["agricultural_action"] = agri_res.action_type
            context_data["agricultural_reasons"] = agri_res.reasoning
            agri_advisory = agri_res

        # If alerts query, retrieve active alerts
        if intent == "alerts" or "alert" in req.message.lower() or "warning" in req.message.lower() or "హెచ్చరిక" in req.message:
            alerts_data = await alert_service.get_alerts_for_location(target_lat, target_lon, location_name)
            context_data["active_alerts"] = [a.model_dump() for a in alerts_data.alerts]

        # Step 5: Natural Language Synthesis via LLM / Fallback
        answer = await llm.generate_response(
            prompt=req.message,
            system_instruction=(
                f"You are WeatherGPT, an AI weather assistant for India and global users. "
                f"Ground your answer strictly on retrieved data. Answer in language: {lang}."
            ),
            language=lang,
            weather_context=context_data
        )

        return ChatResponse(
            answer=answer,
            language=lang,
            intent=intent,
            location=ChatLocationInfo(name=location_name, latitude=target_lat, longitude=target_lon),
            weather_data=weather_payload,
            sources=[forecast.source, "India Meteorological Standards"],
            disclaimer="Weather data provided by meteorological models. Agricultural decisions are advisory only."
        )


chat_service = ChatService()
