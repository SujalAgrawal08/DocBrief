# Use slim Python base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install OS-level dependencies for OCR, NLP, etc.
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    libglib2.0-0 libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app
COPY . .

# Expose port
EXPOSE 8000

# Start the app
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
