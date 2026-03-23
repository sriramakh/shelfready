FROM python:3.12-slim

WORKDIR /app

# Install uv for fast dependency management
RUN pip install uv

# Copy dependency files and app code
COPY pyproject.toml .
COPY app/ app/

# Install dependencies
RUN uv pip install --system .

EXPOSE 8000

# Shell form so $PORT expands (Railway injects PORT)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
