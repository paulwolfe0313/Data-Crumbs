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
        f"Classify this cookie: {cookie.name} from {cookie.domain}, "
        f"{'secure' if cookie.isSecure else 'not secure'}, "
        f"{'httpOnly' if cookie.isHttpOnly else 'not httpOnly'}"
    )

    # Set headers for Replicate API
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Build the request to Replicate's BART model
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.replicate.com/v1/predictions",
            json={
                "version": "17994cf0c98f9d6c4410935e8de63f7cbb41e48e01fc8c0848b5465d2c5f8f73",  # facebook/bart-large-mnli
                "input": {
                    "inputs": prompt,
                    "parameters": {
                        "candidate_labels": "Ad, Analytics, Authentication, Essential, Other"
                    }
                },
                "stream": False  # important to get a full response
            },
            headers=headers
        )

    # Parse the response
    data = response.json()

    labels = data["output"]["labels"]
    scores = data["output"]["scores"]

    return {
        "label": labels[0],
        "confidence": scores[0]
    }
