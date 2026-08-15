import os
import urllib.request
import shutil

FRONTEND_DIR = os.path.abspath("../frontend/public/avatars/seed")
BACKEND_DIR = os.path.abspath("app/static/avatars/seed")

os.makedirs(FRONTEND_DIR, exist_ok=True)
os.makedirs(BACKEND_DIR, exist_ok=True)

SEED_PORTRAITS = {
    "lakshmi_amma.jpg": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    "meenakshi_amma.jpg": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=400&auto=format&fit=crop&q=80",
    "ravi_uncle.jpg": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    "saraswati_amma.jpg": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    "kalyan_sir.jpg": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80",
    "raman_uncle.jpg": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    "ananya_homemaker.jpg": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
}

print("Downloading senior portrait assets...")

headers = {'User-Agent': 'Mozilla/5.0'}

for filename, url in SEED_PORTRAITS.items():
    frontend_path = os.path.join(FRONTEND_DIR, filename)
    backend_path = os.path.join(BACKEND_DIR, filename)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response, open(frontend_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        shutil.copyfile(frontend_path, backend_path)
        print(f"[OK] Saved: {filename} ({os.path.getsize(frontend_path)} bytes)")
    except Exception as e:
        print(f"[ERROR] Failed {filename}: {e}")

print("Seed avatar preparation complete!")
