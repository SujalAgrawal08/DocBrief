# 1. Use a lightweight Python base image
FROM python:3.9-slim

# 2. Install Tesseract OCR engine and system dependencies
#    WHY DOCKER: Tesseract is a C++ system library that cannot be installed
#    via pip. Docker ensures consistent deployment across all environments
#    (local, Render, AWS) without manual system package management.
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory
WORKDIR /app

# 4. Control where sentence-transformers caches the MiniLM model
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_HOME=/app/.cache

# 5. Copy requirements and install Python dependencies
#    (sentence-transformers, faiss-cpu, etc. are installed here)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
COPY . .

# 7. Expose the port Gunicorn will run on
EXPOSE 5000

# 8. Start the application with Gunicorn
#    --workers 1   : Single worker (free-tier memory constraint)
#    --threads 8   : 8 threads for concurrent request handling
#    --timeout 120 : Extended timeout for OCR + RAG + LLM pipeline
CMD gunicorn --workers 1 --threads 8 --timeout 120 --bind 0.0.0.0:$PORT app:app