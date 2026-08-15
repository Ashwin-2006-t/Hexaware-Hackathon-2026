import os
from dotenv import load_dotenv
load_dotenv(".env")

api_key = os.getenv("GEMINI_API_KEY")
from google import genai

client = genai.Client(api_key=api_key)

test_models = [
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
]

for model in test_models:
    try:
        print(f"\n--- Testing model: {model} ---")
        response = client.models.generate_content(
            model=model,
            contents="Say hello in Hindi and explain what SilverHands does in one short sentence."
        )
        print(f"SUCCESS with {model}!")
        print(f"Response:\n{response.text}")
    except Exception as e:
        print(f"FAILED with {model}: {type(e).__name__} - {e}")

# Also test client.interactions if relevant
print("\n--- Testing client.interactions ---")
try:
    if hasattr(client, 'interactions'):
        interaction = client.interactions.create(
            model="gemini-3.5-flash",
            input="Say 'Namaste from SilverHands!'"
        )
        print("Interaction response:", interaction)
except Exception as e:
    print(f"Interaction error: {e}")
