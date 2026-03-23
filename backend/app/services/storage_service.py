"""Supabase Storage service for uploading and managing generated images."""

import logging
import uuid

from ..db.supabase_client import get_supabase

logger = logging.getLogger(__name__)

BUCKET_NAME = "generated-images"


async def upload_image(
    image_bytes: bytes,
    user_id: str,
    file_extension: str = "png",
) -> tuple[str, str]:
    """Upload image bytes to Supabase Storage and return paths.

    Args:
        image_bytes: Raw image file bytes.
        user_id: The owner's user ID (used as folder prefix).
        file_extension: File extension without the dot (default: "png").

    Returns:
        A tuple of (storage_path, public_url).

    Raises:
        RuntimeError: If the upload fails.
    """
    file_id = uuid.uuid4()
    storage_path = f"{user_id}/{file_id}.{file_extension}"

    supabase = get_supabase()
    content_type = _extension_to_mime(file_extension)

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=image_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false",
            },
        )
    except Exception as exc:
        logger.error("Failed to upload image to Supabase Storage: %s", exc)
        raise RuntimeError(
            "Failed to upload generated image. Please try again."
        ) from exc

    # Build the public URL
    try:
        public_url_response = supabase.storage.from_(BUCKET_NAME).get_public_url(
            storage_path
        )
        # get_public_url returns a string directly
        public_url = (
            public_url_response
            if isinstance(public_url_response, str)
            else str(public_url_response)
        )
    except Exception as exc:
        logger.error("Failed to get public URL for uploaded image: %s", exc)
        raise RuntimeError(
            "Image uploaded but failed to generate public URL."
        ) from exc

    logger.info("Uploaded image to %s (user: %s)", storage_path, user_id)
    return storage_path, public_url


async def delete_image(storage_path: str) -> bool:
    """Delete an image from Supabase Storage.

    Args:
        storage_path: The storage path of the file to delete.

    Returns:
        True if deletion succeeded, False otherwise.
    """
    supabase = get_supabase()

    try:
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
        logger.info("Deleted image at %s", storage_path)
        return True
    except Exception as exc:
        logger.error("Failed to delete image at %s: %s", storage_path, exc)
        return False


def _extension_to_mime(extension: str) -> str:
    """Map common image extensions to MIME types."""
    mime_map = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "gif": "image/gif",
    }
    return mime_map.get(extension.lower(), "application/octet-stream")
