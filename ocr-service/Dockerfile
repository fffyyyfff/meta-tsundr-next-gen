FROM python:3.11-slim

# Install system dependencies for PaddleOCR
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application code
COPY src/ src/

# Non-root user with proper home directory for PaddleOCR cache
RUN useradd --create-home --uid 1001 ocr
USER ocr

# Set home for PaddleOCR/PaddleX cache
ENV HOME=/home/ocr

EXPOSE 8100

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8100"]
