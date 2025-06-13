from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

# Load environment variables (e.g., REPLICATE_API_TOKEN)
load_dotenv()
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

app = FastAPI()

# Allow Chrome Extension to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request body schema
class CookieInput(BaseModel):
    name: str
    domain: str
    isSecure: bool
    isHttpOnly: bool

# Define the endpoint for cookie classification
@app.post("/classify-cookie")
async def classify_cookie(cookie: CookieInput):
    prompt = (
        f"Classify the following cookie: "
        f"{cookie.name} from {cookie.domain}. "
        f"It is {'secure' if cookie.isSecure else 'not secure'} and "
        f"{'httpOnly' if cookie.isHttpOnly else 'not httpOnly'}. "
        f"Choose only one label: Ad, Analytics, Authentication, Essential, Other."
    )

    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.replicate.com/v1/predictions",
            json={
                "version": "eec2f71c986dfa3b7a5d842d22e1130550f01572906bec48beaae059b19ef4c",  # flan-t5-xl
                "input": {
                    "prompt": prompt,
                    "temperature": 0.7,
                    "top_p": 0.95
                },
                "stream": False
            },
            headers=headers
        )

    data = response.json()
    print("DEBUG REPLICATE RESPONSE:", data)  # 👀 Log full model response
    output = data.get("output", "").strip()

    return {
        "label": output,
        "confidence": 1.0  # static for now since flan-t5 returns only text
    }