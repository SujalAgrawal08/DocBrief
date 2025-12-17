# 1. Use a lightweight Python base image
FROM python:3.9-slim

# 2. Install Tesseract OCR engine and system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory
WORKDIR /app

# 4. Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the port Gunicorn will run on
EXPOSE 5000

# 7. Start the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]