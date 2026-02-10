# Railway 部署用：不依赖 echuu-agent 子模块，直接用本目录 public/ + backend/
# 构建：Root Directory = deploy/echuu-backend，Dockerfile Path = Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY public /app/public
COPY backend /app/backend
COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

ENV PYTHONPATH=/app/public
WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
