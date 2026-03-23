from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MiniMax
    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimax.io/anthropic"
    minimax_image_url: str = "https://api.minimax.io/v1/image_generation"
    minimax_model: str = "MiniMax-M2.7-fast"

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_starter_price_id: str = ""
    stripe_pro_price_id: str = ""
    stripe_business_price_id: str = ""

    # Email
    resend_api_key: str = ""
    from_email: str = "hello@shelfready.app"

    # OpenAI
    openai_api_key: str = ""

    # Grok
    grok_api_key: str = ""

    # SearXNG
    searxng_url: str = "http://localhost:8080"
    searxng_pages: int = 3

    # App
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    # NOTE: For production, set CORS_ORIGINS env var to your actual domain(s)
    # e.g. CORS_ORIGINS=https://app.shelfready.ai,https://shelfready.ai

    # Quota limits (requests per 5-hour rolling window)
    global_budget_limit: int = 15000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
