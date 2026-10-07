from typing import Dict, Any, List, Tuple
from app.schemas.weather import ForecastResponse
from app.schemas.agriculture import CropAdvisoryResponse, FarmingWindowDay


# Crop physiological characteristics & thresholds
CROP_PROFILES: Dict[str, Dict[str, Any]] = {
    "rice": {
        "name": "Rice / Paddy",
        "water_sensitivity": "high",
        "temp_optimum_min": 20,
        "temp_optimum_max": 35,
        "rain_threshold_irrigation_mm": 5.0,
        "critical_stages": ["transplanting", "panicle_initiation", "flowering"]
    },
    "wheat": {
        "name": "Wheat",
        "water_sensitivity": "medium",
        "temp_optimum_min": 15,
        "temp_optimum_max": 25,
        "rain_threshold_irrigation_mm": 4.0,
        "critical_stages": ["crown_root_initiation", "tillering", "grain_filling"]
    },
    "cotton": {
        "name": "Cotton",
        "water_sensitivity": "high",
        "temp_optimum_min": 21,
        "temp_optimum_max": 35,
        "rain_threshold_irrigation_mm": 6.0,
        "critical_stages": ["square_formation", "flowering", "boll_development"]
    },
    "maize": {
        "name": "Maize / Corn",
        "water_sensitivity": "medium",
        "temp_optimum_min": 18,
        "temp_optimum_max": 32,
        "rain_threshold_irrigation_mm": 5.0,
        "critical_stages": ["tasseling", "silking"]
    },
    "groundnut": {
        "name": "Groundnut / Peanut",
        "water_sensitivity": "medium",
        "temp_optimum_min": 22,
        "temp_optimum_max": 30,
        "rain_threshold_irrigation_mm": 4.0,
        "critical_stages": ["flowering", "peg_penetration", "pod_development"]
    },
    "tomato": {
        "name": "Tomato",
        "water_sensitivity": "high",
        "temp_optimum_min": 18,
        "temp_optimum_max": 30,
        "rain_threshold_irrigation_mm": 4.0,
        "critical_stages": ["flowering", "fruit_set"]
    },
    "chili": {
        "name": "Chili / Pepper",
        "water_sensitivity": "medium",
        "temp_optimum_min": 20,
        "temp_optimum_max": 32,
        "rain_threshold_irrigation_mm": 4.0,
        "critical_stages": ["flowering", "pod_setting"]
    },
    "sugarcane": {
        "name": "Sugarcane",
        "water_sensitivity": "high",
        "temp_optimum_min": 24,
        "temp_optimum_max": 38,
        "rain_threshold_irrigation_mm": 8.0,
        "critical_stages": ["formative", "grand_growth"]
    }
}


def evaluate_agricultural_rules(
    crop: str,
    goal: str,
    soil_type: str,
    crop_stage: str,
    forecast: ForecastResponse,
    language: str = "en"
) -> CropAdvisoryResponse:
    crop_key = crop.lower().strip()
    profile = CROP_PROFILES.get(crop_key, CROP_PROFILES["rice"])
    crop_display_name = profile["name"]

    curr = forecast.current
    daily = forecast.daily
    hourly = forecast.hourly

    # Extract 24-48h forecast parameters
    rain_prob_24h = max((h.rain_probability for h in hourly[:24]), default=curr.rain_probability)
    rain_sum_24h = sum(h.precipitation for h in hourly[:24])
    rain_prob_48h = max((h.rain_probability for h in hourly[:48]), default=curr.rain_probability)
    rain_sum_48h = sum(h.precipitation for h in hourly[:48])
    max_wind_24h = max((h.wind_speed for h in hourly[:24]), default=curr.wind_speed)
    temp_max_24h = daily[0].max_temperature if daily else curr.temperature
    temp_min_24h = daily[0].min_temperature if daily else curr.temperature
    humidity_curr = curr.humidity

    goal_key = goal.lower().strip()
    recommendation = ""
    action_type = "proceed"  # proceed, postpone, caution
    urgency = "medium"
    reasoning: List[str] = []

    # 1. GOAL: IRRIGATION
    if "irrigat" in goal_key:
        thresh = profile["rain_threshold_irrigation_mm"]
        if rain_prob_24h >= 65 or rain_sum_24h >= thresh:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Postpone irrigation for {crop_display_name}."
            reasoning.append(f"Rain probability is {rain_prob_24h}% with expected accumulation of {rain_sum_24h:.1f} mm in next 24 hours.")
            reasoning.append(f"Applying irrigation now risks waterlogging, nutrient leaching, and unnecessary water expenditure.")
            if soil_type in ["clay", "clay_loam", "black_cotton"]:
                reasoning.append(f"Your {soil_type.replace('_', ' ')} soil has high water retention capacity, aggravating stagnation risk.")
        elif rain_prob_48h >= 60 and rain_sum_48h >= thresh:
            action_type = "caution"
            urgency = "medium"
            recommendation = f"Delay irrigation or apply light surface irrigation only."
            reasoning.append(f"Moderate rain probability ({rain_prob_48h}%) expected within 48 hours ({rain_sum_48h:.1f} mm rain).")
            reasoning.append(f"Monitor field moisture before turning on electric/diesel tube wells.")
        else:
            action_type = "proceed"
            urgency = "low"
            recommendation = f"Favorable conditions to proceed with scheduled irrigation."
            reasoning.append(f"Low rain probability ({rain_prob_24h}%) over the next 24-48 hours.")
            reasoning.append(f"Temperature high of {temp_max_24h:.1f}°C will sustain optimal evapotranspiration for {crop_display_name}.")

    # 2. GOAL: SPRAYING (PESTICIDE / FUNGICIDE / HERBICIDE)
    elif "spray" in goal_key:
        if max_wind_24h > 18.0:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Avoid pesticide/fungicide spraying due to strong winds."
            reasoning.append(f"Wind speed forecast up to {max_wind_24h:.1f} km/h (safe spraying limit is < 15 km/h).")
            reasoning.append("High wind causes significant spray drift, reducing target coverage and contaminating adjacent areas.")
        elif rain_prob_24h > 40 or rain_sum_24h > 1.0:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Postpone chemical spraying — rain will wash off foliar chemicals."
            reasoning.append(f"Rain chance is {rain_prob_24h}% within next 24 hours.")
            reasoning.append("Pesticides require at least a 4-6 hour rain-free window for proper plant absorption.")
        elif temp_max_24h > 36.0:
            action_type = "caution"
            urgency = "medium"
            recommendation = f"Spray only during early morning (6-9 AM) or late evening (4-6 PM)."
            reasoning.append(f"Peak day temperature reaches {temp_max_24h:.1f}°C. Midday spraying causes rapid droplet evaporation and phytotoxicity.")
        else:
            action_type = "proceed"
            urgency = "low"
            recommendation = f"Favorable window for crop spraying."
            reasoning.append(f"Mild wind speeds ({max_wind_24h:.1f} km/h) and dry weather (< {rain_prob_24h}% rain) provide optimal chemical deposition.")

    # 3. GOAL: SOWING / PLANTING
    elif "sow" in goal_key or "plant" in goal_key:
        if rain_sum_24h > 25.0:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Postpone sowing — heavy rain will displace seeds."
            reasoning.append(f"Heavy rainfall ({rain_sum_24h:.1f} mm) forecast will cause soil capping, seed rotting, and crust formation.")
        elif temp_max_24h > profile["temp_optimum_max"] + 4:
            action_type = "caution"
            urgency = "medium"
            recommendation = f"Delay sowing until extreme heat moderates."
            reasoning.append(f"Maximum temperature ({temp_max_24h:.1f}°C) exceeds ideal germination range for {crop_display_name}.")
        else:
            action_type = "proceed"
            urgency = "low"
            recommendation = f"Favorable soil and weather conditions for sowing {crop_display_name}."
            reasoning.append(f"Moderate temperatures ({temp_min_24h:.1f}°C to {temp_max_24h:.1f}°C) and adequate moisture will support vigorous germination.")

    # 4. GOAL: HARVESTING
    elif "harvest" in goal_key:
        if rain_prob_24h > 30 or rain_sum_24h > 2.0:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Postpone harvesting and protect harvested produce."
            reasoning.append(f"Rain probability ({rain_prob_24h}%) will increase grain/fiber moisture and risk fungal mold or grain discoloration.")
            reasoning.append("Ensure already harvested crop is shifted to covered threshing floors or tarpaulin protection.")
        else:
            action_type = "proceed"
            urgency = "low"
            recommendation = f"Excellent dry window for harvesting and sun drying."
            reasoning.append(f"Dry sunny conditions ({rain_prob_24h}% rain chance) ensure clean threshing and safe moisture reduction.")

    # 5. GOAL: FERTILIZER APPLICATION
    elif "fertiliz" in goal_key:
        if rain_prob_24h > 70 or rain_sum_24h > 15.0:
            action_type = "postpone"
            urgency = "high"
            recommendation = f"Hold top-dressing fertilizer application."
            reasoning.append(f"High rain chance ({rain_prob_24h}%) will wash away nitrogenous fertilizers (Urea/DAP) via surface runoff.")
        else:
            action_type = "proceed"
            urgency = "low"
            recommendation = f"Proceed with fertilizer broadcast on moist soil."
            reasoning.append("Optimal soil moisture supports fertilizer solubilization without runoff losses.")
    else:
        action_type = "proceed"
        recommendation = f"General field conditions are stable for {crop_display_name}."
        reasoning.append(f"Current temperature: {curr.temperature}°C, rain probability: {rain_prob_24h}%.")

    # Generate 3-Day Farming Window
    farming_window: List[FarmingWindowDay] = []
    days_to_check = daily[:3] if len(daily) >= 3 else daily
    day_names = ["Today", "Tomorrow", "Day 3"]

    for idx, d in enumerate(days_to_check):
        d_name = day_names[idx] if idx < len(day_names) else d.date
        d_rain = d.rain_probability
        d_mm = d.precipitation_sum
        d_wind = d.wind_speed_max

        # Status determination
        if d_rain > 60 or d_mm > 10.0 or d_wind > 25.0:
            status = "Unfavorable"
            suitable = False
            notes = f"High rain/wind ({d_rain}%, {d_wind} km/h). Restrict operations."
        elif d_rain > 30 or d_wind > 15.0:
            status = "Caution"
            suitable = True
            notes = f"Moderate conditions ({d_rain}% rain, {d_wind} km/h wind). Monitor skies."
        else:
            status = "Suitable"
            suitable = True
            notes = f"Dry & clear. Ideal for all farming tasks."

        farming_window.append(FarmingWindowDay(
            date=d.date,
            day_name=d_name,
            suitable=suitable,
            status=status,
            rain_probability=d_rain,
            rainfall_mm=d_mm,
            wind_speed_kmh=d_wind,
            temp_max=d.max_temperature,
            temp_min=d.min_temperature,
            advisory_notes=notes
        ))

    # Multilingual AI explanation
    if language == "te":
        ai_explanation = (
            f"{crop_display_name} పంటకు సంబంధించి {goal}: "
            f"{'దయచేసి ఈ పనిని వాయిదా వేయండి.' if action_type == 'postpone' else 'జాగ్రత్తగా కొనసాగించండి.' if action_type == 'caution' else 'వాతావరణం పూర్తిగా అనుకూలంగా ఉంది.'} "
            f"రాబోయే 24 గంటల్లో వర్షం అవకాశం {rain_prob_24h}% మరియు గాలి వేగం {max_wind_24h:.1f} km/h."
        )
    elif language == "hi":
        ai_explanation = (
            f"{crop_display_name} के लिए {goal} परामर्श: "
            f"{'कृपया इसे अभी टाल दें।' if action_type == 'postpone' else 'सावधानीपूर्वक आगे बढ़ें।' if action_type == 'caution' else 'मौसम पूरी तरह अनुकूल है।' } "
            f"अगले 24 घंटों में बारिश की संभावना {rain_prob_24h}% और हवा की गति {max_wind_24h:.1f} km/h है।"
        )
    else:
        ai_explanation = (
            f"Advisory for {crop_display_name} ({goal}): "
            f"{'It is strongly advised to postpone this activity.' if action_type == 'postpone' else 'Proceed with caution.' if action_type == 'caution' else 'Field conditions are favorable.'} "
            f"The 24-hour forecast indicates a {rain_prob_24h}% chance of rain with max wind gusts of {max_wind_24h:.1f} km/h."
        )

    return CropAdvisoryResponse(
        crop=crop_display_name,
        goal=goal.title(),
        recommendation=recommendation,
        action_type=action_type,
        urgency=urgency,
        reasoning=reasoning,
        ai_explanation=ai_explanation,
        weather_summary={
            "rain_probability_24h": rain_prob_24h,
            "expected_rainfall_mm": round(rain_sum_24h, 1),
            "max_wind_speed_kmh": round(max_wind_24h, 1),
            "temp_max_c": round(temp_max_24h, 1),
            "temp_min_c": round(temp_min_24h, 1),
            "humidity": humidity_curr
        },
        farming_window=farming_window,
        language=language
    )
