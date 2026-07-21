# 1. Use an official lightweight Python image
FROM python:3.11-slim

# 2. Set environment variables
# Prevent Python from creating .pyc bytecode files in __pycache__/ which is unnessary
ENV PYTHONDONTWRITEBYTECODE=1

# Ensure logs appear immediately in Docker logs, so message might appear as soon as it is logged
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy dependency file first
# This helps Docker cache the dependency installation layer
COPY requirements.txt .

# 5. Install Python dependencies, without store downoaded package files in pi cahche to keep docker image smaller
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# 6. Copy the application code
COPY . .

# 7. Document the port used by the application
EXPOSE 8000

# 8. Start the FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]