import os
import sys
from dotenv import load_dotenv
load_dotenv(".env")

api_key = os.getenv("GEMINI_API_KEY")
from google import genai

client = genai.Client(api_key=api_key)

model = sys.argv[1] if len(sys.argv) > 1 else "gemini-2.5-flash"
print(f"Testing model: {model}")
try:
    resp = client.models.generate_content(
        model=model,
        contents="Hello! Give a 1-sentence description of senior skills in India in English."
    )
    print("SUCCESS!")
    print("Response text:", resp.text)
except Exception as e:
    print(f"FAILED: {type(e).__name__} - {e}")
