from uuid import UUID

from .supabase_client import get_supabase


class BaseRepository:
    """Base CRUD operations for Supabase tables."""

    def __init__(self, table_name: str):
        self.table_name = table_name

    @property
    def table(self):
        return get_supabase().table(self.table_name)

    def get_by_id(self, record_id: UUID, user_id: str) -> dict | None:
        result = (
            self.table.select("*")
            .eq("id", str(record_id))
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data

    def list_by_user(
        self, user_id: str, page: int = 1, per_page: int = 20
    ) -> tuple[list[dict], int]:
        offset = (page - 1) * per_page

        # Get count
        count_result = (
            self.table.select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total = count_result.count or 0

        # Get paginated results
        result = (
            self.table.select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )

        return result.data or [], total

    def create(self, data: dict) -> dict:
        result = self.table.insert(data).execute()
        return result.data[0]

    def update(self, record_id: UUID, user_id: str, data: dict) -> dict | None:
        result = (
            self.table.update(data)
            .eq("id", str(record_id))
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete(self, record_id: UUID, user_id: str) -> bool:
        result = (
            self.table.delete()
            .eq("id", str(record_id))
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result.data)


listings_repo = BaseRepository("listings")
images_repo = BaseRepository("generated_images")
social_repo = BaseRepository("social_posts")
ads_repo = BaseRepository("ad_copies")
research_repo = BaseRepository("research_sessions")
