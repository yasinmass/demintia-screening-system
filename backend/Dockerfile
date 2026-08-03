FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y \
    pkg-config \
    curl \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "healthcare.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]