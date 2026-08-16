"""
Supabase REST API client for SilverHands.
Uses httpx to interact with Supabase Storage and PostgREST APIs.
This avoids the need for direct PostgreSQL connection (which may be blocked
by network/DNS issues), while still allowing media uploads and table creation.
"""
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[httpx.Client] = None


def get_supabase_client() -> Optional[httpx.Client]:
    """Returns a configured httpx client for Supabase REST API."""
    global _client
    url = (settings.SUPABASE_URL or "").strip()
    key = (settings.SUPABASE_SERVICE_ROLE_KEY or "").strip()
    if not url or not key or len(key) < 20:
        return None
    if _client is None:
        _client = httpx.Client(
            base_url=url,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
            },
            timeout=30.0,
        )
    return _client


def is_supabase_available() -> bool:
    """Check if Supabase REST API is reachable."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        r = client.get("/rest/v1/", headers={"Accept": "application/json"})
        return r.status_code in (200, 401, 406)
    except Exception as e:
        logger.warning(f"Supabase REST API unreachable: {e}")
        return False


def ensure_storage_bucket(bucket_name: str, public: bool = True) -> bool:
    """Creates a storage bucket if it doesn't exist. Returns True on success."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        # Check if bucket exists
        r = client.get(f"/storage/v1/bucket/{bucket_name}")
        if r.status_code == 200:
            return True
        # Create bucket
        r = client.post(
            "/storage/v1/bucket",
            json={"id": bucket_name, "name": bucket_name, "public": public},
        )
        if r.status_code in (200, 201):
            logger.info(f"Created Supabase Storage bucket: {bucket_name}")
            return True
        logger.warning(f"Failed to create bucket {bucket_name}: {r.status_code} {r.text[:200]}")
        return False
    except Exception as e:
        logger.warning(f"Storage bucket creation error: {e}")
        return False


def upload_to_storage(
    bucket: str,
    path: str,
    file_bytes: bytes,
    content_type: str = "application/octet-stream",
) -> Optional[str]:
    """
    Uploads a file to Supabase Storage.
    Returns the public URL on success, None on failure.
    """
    client = get_supabase_client()
    if not client:
        return None

    ensure_storage_bucket(bucket, public=True)

    try:
        # Upsert the file (overwrite if exists)
        r = client.post(
            f"/storage/v1/object/{bucket}/{path}",
            content=file_bytes,
            headers={
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )
        if r.status_code in (200, 201):
            supabase_url = (settings.SUPABASE_URL or "").strip().rstrip("/")
            public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{path}"
            logger.info(f"Uploaded to Supabase Storage: {public_url}")
            return public_url
        else:
            logger.warning(
                f"Supabase Storage upload failed: {r.status_code} {r.text[:200]}"
            )
            return None
    except Exception as e:
        logger.warning(f"Supabase Storage upload error: {e}")
        return None


def delete_from_storage(bucket: str, path: str) -> bool:
    """Deletes a file from Supabase Storage."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        r = client.delete(
            f"/storage/v1/object/{bucket}",
            json={"prefixes": [path]},
        )
        return r.status_code in (200, 204)
    except Exception as e:
        logger.warning(f"Supabase Storage delete error: {e}")
        return False
