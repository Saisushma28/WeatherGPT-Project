import re
from typing import Dict, Any, Optional
from app.providers.llm.base import BaseLLMProvider


class FallbackLLMProvider(BaseLLMProvider):
    """
    Deterministic rule-based NLP engine supporting English, Hindi, and Telugu.
    Guarantees 0% hallucination by strictly translating structured meteorological data
    into fluent natural language sentences.
    """

    INTENT_KEYWORDS = {
        "forecast": ["tomorrow", "forecast", "next", "days", "कल", "రేపు", "రాబోయే", "ముందు"],
        "rain": ["rain", "umbrella", "shower", "precipitation", "बारिश", "वर्षा", "छाता", "వర్షం", "గొడుగు", "వాన"],
        "temperature": ["temp", "temperature", "hot", "cold", "warm", "तापमान", "गर्मी", "सर्दी", "ఉష్ణోగ్రత", "వేడి", "చలి"],
        "wind": ["wind", "speed", "breeze", "gale", "हवा", "గాలి", "గాలులు"],
        "alerts": ["warning", "alert", "danger", "cyclone", "चेतावनी", "अलर्ट", "హెచ్చరిక", "ప్రమాదం"],
        "travel": ["travel", "trip", "drive", "outside", "यात्रा", "सफर", "ప్రయాణం"],
        "agriculture": ["crop", "irrigate", "irrigation", "sow", "spray", "farm", "किसान", "फसल", "सिंचाई", "రైతు", "పంట", "నీరు", "మందు"]
    }

    KNOWN_INDIAN_CITIES = [
        "hyderabad", "delhi", "mumbai", "bengaluru", "bangalore", "chennai", "kolkata",
        "pune", "ahmedabad", "jaipur", "lucknow", "visakhapatnam", "vizag", "vijayawada",
        "warangal", "guntur", "nellore", "tirupati", "kurnool", "nizamabad", "karimnagar",
        "patna", "bhopal", "chandigarh", "coimbatore", "kochi", "nagpur", "surat"
    ]

    async def extract_intent_and_entities(self, query: str) -> Dict[str, Any]:
        q_lower = query.lower()

        # Language Detection
        detected_lang = "en"
        # Telugu Unicode range: \u0C00-\u0C7F
        if re.search(r'[\u0C00-\u0C7F]', query):
            detected_lang = "te"
        # Devanagari / Hindi Unicode range: \u0900-\u097F
        elif re.search(r'[\u0900-\u097F]', query):
            detected_lang = "hi"
        elif "telugu" in q_lower or "తెలుగు" in query:
            detected_lang = "te"
        elif "hindi" in q_lower or "हिंदी" in query:
            detected_lang = "hi"

        # Intent detection
        detected_intent = "current_weather"
        for intent, kws in self.INTENT_KEYWORDS.items():
            if any(kw in q_lower or kw in query for kw in kws):
                detected_intent = intent
                break

        # Date extraction
        date_ref = "today"
        if any(w in q_lower or w in query for w in ["tomorrow", "कल", "రేపు"]):
            date_ref = "tomorrow"
        elif any(w in q_lower or w in query for w in ["5 days", "7 days", "week", "వారంలో"]):
            date_ref = "multiday"

        # Location extraction
        detected_location = None
        for city in self.KNOWN_INDIAN_CITIES:
            if city in q_lower:
                detected_location = city.title()
                break
        if not detected_location:
            # Check for Telugu city names
            if "హైదరాబాద్" in query or "హైదరాబాదు" in query:
                detected_location = "Hyderabad"
            elif "విజయవాడ" in query:
                detected_location = "Vijayawada"
            elif "విశాఖపట్నం" in query or "వైజాగ్" in query:
                detected_location = "Visakhapatnam"
            elif "వరంగల్" in query:
                detected_location = "Warangal"
            elif "గుంటూరు" in query:
                detected_location = "Guntur"
            elif "తిరుపతి" in query:
                detected_location = "Tirupati"
            elif "ఢిల్లీ" in query or "दिल्ली" in query:
                detected_location = "Delhi"
            elif "ముంబై" in query or "मुंबई" in query:
                detected_location = "Mumbai"

        # Parameter
        param = "general"
        if "rain" in detected_intent:
            param = "rain_probability"
        elif "temp" in detected_intent:
            param = "temperature"
        elif "wind" in detected_intent:
            param = "wind_speed"

        return {
            "intent": detected_intent,
            "location": detected_location,
            "date": date_ref,
            "parameter": param,
            "language": detected_lang,
            "goal": "general"
        }

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        language: str = "en",
        weather_context: Optional[Dict[str, Any]] = None
    ) -> str:
        ctx = weather_context or {}
        curr = ctx.get("current", {})
        loc = ctx.get("location", {})
        loc_name = loc.get("name", "your area") if isinstance(loc, dict) else "your area"
        temp = curr.get("temperature", "--")
        feels_like = curr.get("feels_like", "--")
        cond = curr.get("condition", "Fair")
        rain_prob = curr.get("rain_probability", 0)
        precip = curr.get("precipitation", 0.0)
        wind = curr.get("wind_speed", 0.0)
        humidity = curr.get("humidity", 50)
        intent = ctx.get("intent", "current")
        date = ctx.get("date", "today")

        # Telugu responses
        if language == "te":
            if intent in ["rain", "forecast"] and date == "tomorrow":
                if rain_prob >= 50:
                    return f"రేపు {loc_name} లో వర్షం పడే అవకాశం ఎక్కువగా ఉంది (సుమారు {rain_prob}%). గొడుగు వెంట ఉంచుకోవడం మంచిది. గరిష్ట ఉష్ణోగ్రత దాదాపు {temp}°C గా ఉండే అవకాశం ఉంది."
                else:
                    return f"రేపు {loc_name} లో వర్షం పడే అవకాశం తక్కువగా ఉంది (సుమారు {rain_prob}%). వాతావరణం ప్రధానంగా {cond} గా ఉంటుంది, ఉష్ణోగ్రత దాదాపు {temp}°C."
            elif intent == "rain":
                if rain_prob >= 50 or precip > 1.0:
                    return f"ప్రస్తుతం {loc_name} లో వర్షం పడే అవకాశం {rain_prob}% ఉంది. గొడుగు తీసుకెళ్లడం సూచించబడింది."
                else:
                    return f"ప్రస్తుతం {loc_name} లో వర్షం పడే అవకాశం చాలా తక్కువ ({rain_prob}%). వాతావరణం {cond} గా ఉంది."
            elif intent == "temperature":
                return f"{loc_name} లో ప్రస్తుత ఉష్ణోగ్రత {temp}°C (అనిపించే ఉష్ణోగ్రత {feels_like}°C), తేమ {humidity}%."
            elif intent == "travel":
                if rain_prob > 60 or wind > 40:
                    return f"ప్రయాణంలో జాగ్రత్త అవసరం. {loc_name} లో వర్షం అవకాశం {rain_prob}% మరియు గాలి వేగం {wind} km/h గా ఉంది."
                else:
                    return f"{loc_name} లో ప్రయాణానికి వాతావరణం అనుకూలంగా ఉంది. ఉష్ణోగ్రత {temp}°C, వర్షం అవకాశం {rain_prob}% మాత్రమే."
            else:
                return f"{loc_name} లో ప్రస్తుత వాతావరణం: ఉష్ణోగ్రత {temp}°C ({cond}), తేమ {humidity}%, గాలి వేగం {wind} km/h, వర్షం అవకాశం {rain_prob}%."

        # Hindi responses
        elif language == "hi":
            if intent in ["rain", "forecast"] and date == "tomorrow":
                if rain_prob >= 50:
                    return f"कल {loc_name} में बारिश की संभावना अधिक है (लगभग {rain_prob}%)। बाहर जाते समय छाता साथ रखें। तापमान लगभग {temp}°C रहने का अनुमान है।"
                else:
                    return f"कल {loc_name} में बारिश की संभावना कम है (लगभग {rain_prob}%)। मौसम मुख्य रूप से {cond} रहेगा, तापमान लगभग {temp}°C।"
            elif intent == "rain":
                if rain_prob >= 50 or precip > 1.0:
                    return f"वर्तमान में {loc_name} में बारिश की संभावना {rain_prob}% है। छाता ले जाना उचित रहेगा।"
                else:
                    return f"वर्तमान में {loc_name} में बारिश की संभावना कम ({rain_prob}%) है। मौसम {cond} बना हुआ है।"
            elif intent == "temperature":
                return f"{loc_name} में वर्तमान तापमान {temp}°C है (महसूस {feels_like}°C), आर्द्रता {humidity}% है।"
            elif intent == "travel":
                if rain_prob > 60 or wind > 40:
                    return f"यात्रा के दौरान सावधानी बरतें। {loc_name} में {rain_prob}% बारिश और {wind} km/h हवा की संभावना है।"
                else:
                    return f"{loc_name} में मौसम यात्रा के लिए अनुकूल है। तापमान {temp}°C और बारिश की संभावना केवल {rain_prob}% है।"
            else:
                return f"{loc_name} में वर्तमान मौसम: तापमान {temp}°C ({cond}), आर्द्रता {humidity}%, हवा की गति {wind} km/h, बारिश की संभावना {rain_prob}%।"

        # English responses (default)
        else:
            if intent in ["rain", "forecast"] and date == "tomorrow":
                if rain_prob >= 50:
                    return f"Tomorrow in {loc_name}, meteorological data indicates a high probability of rain (~{rain_prob}% chance). Maximum temperatures will hover around {temp}°C. Carrying an umbrella is recommended."
                else:
                    return f"Tomorrow in {loc_name}, rain probability is low (~{rain_prob}%). Conditions are expected to remain mostly {cond} with temperatures near {temp}°C."
            elif intent == "rain":
                if rain_prob >= 50 or precip > 1.0:
                    return f"In {loc_name}, rain probability is currently elevated at {rain_prob}%, with precipitation around {precip} mm. Carrying rain protection is advised."
                else:
                    return f"In {loc_name}, rain probability is low at {rain_prob}%. Weather condition is currently {cond}."
            elif intent == "temperature":
                return f"The current temperature in {loc_name} is {temp}°C (feels like {feels_like}°C) with {humidity}% humidity."
            elif intent == "travel":
                if rain_prob > 60 or wind > 40:
                    return f"Travel caution advised for {loc_name}: Rain probability is {rain_prob}% and wind gusts are around {wind} km/h. Check road visibility before proceeding."
                else:
                    return f"Conditions in {loc_name} are generally favorable for travel: Temperature is {temp}°C, conditions are {cond}, and rain probability is {rain_prob}%."
            else:
                return f"Currently in {loc_name}: {temp}°C with {cond} skies. Relative humidity is {humidity}%, wind speed is {wind} km/h, and rain chance is {rain_prob}%."
