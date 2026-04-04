FROM python:3.11-slim
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY src/ src/
EXPOSE 8100
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8100"]
