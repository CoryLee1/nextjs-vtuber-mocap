# 用于 Railway / Render / Fly 等部署 Echuu workflow 后端
# 构建：在「仓库根」执行 docker build -f echuu-agent/workflow/backend/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

COPY echuu-agent/public /app/public
COPY echuu-agent/workflow/backend /app/backend
COPY echuu-agent/requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

ENV PYTHONPATH=/app/public
WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
