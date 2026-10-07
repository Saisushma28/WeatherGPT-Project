import uuid
from typing import List, Optional
from app.schemas.alerts import AlertItem
from app.schemas.weather import ForecastResponse


def evaluate_weather_alerts(
    forecast: ForecastResponse,
    location_name: str,
    latitude: float,
    longitude: float
) -> List[AlertItem]:
    """
    Evaluate weather forecast data against IMD (India Meteorological Department)
    and international meteorological warning criteria.
    Outputs deterministic, verified alert items with precautions.
    """
    alerts: List[AlertItem] = []
    curr = forecast.current
    daily = forecast.daily
    hourly = forecast.hourly

    # Check 1: Heavy / Very Heavy Rainfall (Daily or Next 24h)
    next_24h_precip = sum(h.precipitation for h in hourly[:24])
    today_precip_sum = daily[0].precipitation_sum if daily else curr.precipitation

    max_rain = max(next_24h_precip, today_precip_sum)
    if max_rain >= 204.5:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Extremely Heavy Rainfall",
            severity="Extreme",
            color="red",
            headline=f"Red Alert: Extremely Heavy Rainfall expected in {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            start_time=daily[0].date if daily else None,
            end_time=daily[1].date if len(daily) > 1 else None,
            description=f"Meteorological models indicate localized rainfall accumulation of {max_rain:.1f} mm, surpassing the 204.5 mm/day threshold.",
            precautions=[
                "Avoid non-essential travel and stay away from low-lying flood-prone areas.",
                "Keep emergency contact numbers and power banks charged.",
                "Do not drive or walk through waterlogged roads or swollen storm drains.",
                "Follow official disaster management authority (NDRF/SDRF) advisories."
            ],
            source="IMD Rule Engine"
        ))
    elif max_rain >= 115.6:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Very Heavy Rainfall",
            severity="Severe",
            color="orange",
            headline=f"Orange Alert: Very Heavy Rainfall warning for {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            start_time=daily[0].date if daily else None,
            end_time=daily[1].date if len(daily) > 1 else None,
            description=f"Forecast indicates rainfall accumulation between 115.6 mm and 204.4 mm ({max_rain:.1f} mm expected) over the next 24 hours.",
            precautions=[
                "Check road and traffic advisories before commuting.",
                "Farmers should ensure adequate drainage channels in agricultural fields.",
                "Avoid parking vehicles under large trees or weak structures."
            ],
            source="IMD Rule Engine"
        ))
    elif max_rain >= 64.5:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Heavy Rainfall",
            severity="Moderate",
            color="yellow",
            headline=f"Yellow Watch: Heavy Rainfall likely in {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            start_time=daily[0].date if daily else None,
            end_time=daily[1].date if len(daily) > 1 else None,
            description=f"Expected 24-hour rainfall accumulation of {max_rain:.1f} mm (IMD threshold >= 64.5 mm).",
            precautions=[
                "Carry rain protection equipment (umbrella, waterproof gear).",
                "Be alert for temporary localized water stagnation."
            ],
            source="IMD Rule Engine"
        ))

    # Check 2: Thunderstorm and Lightning
    thunderstorm_codes = {95, 96, 99}
    has_thunderstorm_code = any(h.weather_code in thunderstorm_codes for h in hourly[:24]) or (curr.condition_code in thunderstorm_codes)
    if has_thunderstorm_code:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Thunderstorm & Lightning",
            severity="Severe",
            color="orange",
            headline=f"Orange Warning: Thunderstorm with Lightning in {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            description="Active atmospheric instability triggering convective thunderstorm activity and lightning strikes.",
            precautions=[
                "Seek immediate indoor shelter; avoid open fields, isolated trees, and metal poles.",
                "Unplug sensitive electronic appliances during thunderstorm activity.",
                "Do not use corded phones or take baths/showers during active lightning."
            ],
            source="IMD Rule Engine"
        ))

    # Check 3: Heatwave / Extreme Temperature
    max_temp_today = daily[0].max_temperature if daily else curr.temperature
    if max_temp_today >= 45.0:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Severe Heatwave",
            severity="Extreme",
            color="red",
            headline=f"Red Alert: Severe Heatwave conditions in {location_name} ({max_temp_today:.1f}°C)",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            description=f"Maximum temperatures forecast to reach {max_temp_today:.1f}°C, exceeding critical severe heatwave thresholds.",
            precautions=[
                "Avoid sun exposure between 11:00 AM and 4:00 PM.",
                "Stay continuously hydrated with water, ORS, buttermilk, or lemon water.",
                "Protect children, elderly, and outdoor workers from direct heat stress.",
                "Never leave children or pets unattended in closed vehicles."
            ],
            source="IMD Rule Engine"
        ))
    elif max_temp_today >= 40.0:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Heatwave Warning",
            severity="Moderate",
            color="yellow",
            headline=f"Yellow Watch: Heatwave conditions expected in {location_name} ({max_temp_today:.1f}°C)",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            description=f"Day temperatures reaching {max_temp_today:.1f}°C. High heat index precautions advised.",
            precautions=[
                "Wear lightweight, loose, light-colored cotton clothing.",
                "Cover head with cloth, hat, or umbrella when stepping outdoors.",
                "Drink ample water even if not thirsty."
            ],
            source="IMD Rule Engine"
        ))

    # Check 4: Strong Winds / Gale
    max_wind_kmh = max((h.wind_speed for h in hourly[:24]), default=curr.wind_speed)
    if max_wind_kmh >= 62.0:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Gale / Strong Wind Squall",
            severity="Severe",
            color="orange",
            headline=f"Orange Alert: High wind gusts ({max_wind_kmh:.1f} km/h) expected in {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            description=f"Surface wind speeds forecast to gust up to {max_wind_kmh:.1f} km/h.",
            precautions=[
                "Secure loose outdoor fixtures, tin roofs, and scaffolding.",
                "Drive slowly and watch out for fallen branches or electric lines."
            ],
            source="IMD Rule Engine"
        ))
    elif max_wind_kmh >= 45.0:
        alerts.append(AlertItem(
            id=str(uuid.uuid4())[:8],
            alert_type="Gusty Winds",
            severity="Minor",
            color="yellow",
            headline=f"Yellow Watch: Gusty winds ({max_wind_kmh:.1f} km/h) in {location_name}",
            affected_location=location_name,
            latitude=latitude,
            longitude=longitude,
            description=f"Brisk wind gusts up to {max_wind_kmh:.1f} km/h.",
            precautions=[
                "Exercise caution during outdoor activities and two-wheeler commuting."
            ],
            source="IMD Rule Engine"
        ))

    return alerts
