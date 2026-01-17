# AI Service - Test Guide

Complete guide to clone, setup, and test all AI-service endpoints.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone & Setup](#clone--setup)
3. [Environment Configuration](#environment-configuration)
4. [Start Services](#start-services)
5. [Get Authentication Token](#get-authentication-token)
6. [Test All Endpoints](#test-all-endpoints)
7. [Quick Test Script](#quick-test-script)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | v20+ | `node --version` |
| npm | v10+ | `npm --version` |
| Docker Desktop | Latest | `docker --version` |
| Git | Latest | `git --version` |
| curl | Any | `curl --version` |

---

## Clone & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd FEPA
```

### Step 2: Install Dependencies for AI Service

```bash
cd ai-service
npm install --legacy-peer-deps
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Install Dependencies for Required Services

```bash
# API Gateway (required - exposes HTTP endpoints)
cd ../api-gateway
npm install --legacy-peer-deps

# Auth Service (required - for authentication)
cd ../auth-service
npm install --legacy-peer-deps
```

---

## Environment Configuration

### Step 1: Create .env file for AI Service

```bash
cd ai-service
cp .env.example .env
```

### Step 2: Edit .env file

```env
# Database
DATABASE_URL="postgresql://fepa:fepa123@localhost:5432/fepa_ai?schema=public"

# RabbitMQ
RABBITMQ_URL=amqp://fepa:fepa123@localhost:5672

# Gemini API (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# AI Configuration
AI_CONFIDENCE_THRESHOLD=0.7
ANOMALY_ZSCORE_THRESHOLD=2.5
BUDGET_ALERT_THRESHOLDS=50,80,100
```

### Step 3: Get Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with Google Account
3. Click "Create API Key"
4. Copy and paste into `.env` file

### Step 4: Important - Use Correct Gemini Model

**CRITICAL**: Use `gemini-2.5-flash` model (stable version).

| Model | Status | Free Tier Quota |
|-------|--------|-----------------|
| `gemini-2.5-flash` | Recommended | Available |
| `gemini-2.0-flash` | Works | Available |
| `gemini-2.0-flash-exp` | NOT Recommended | Limit: 0 (Quota Exceeded) |

### Step 5: Update docker-compose.yml (if using Docker)

Edit `ai-service/docker-compose.yml` to add `GEMINI_MODEL`:

```yaml
services:
  ai-service:
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GEMINI_MODEL=gemini-2.5-flash  # Add this line!
```

---

## Start Services

### Option A: Development Mode (Recommended for Testing)

#### Terminal 1: Start Infrastructure

```bash
cd deployment
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME              STATUS          PORTS
fepa-mongodb      Up (healthy)    27017->27017
fepa-postgres     Up (healthy)    5432->5432
fepa-rabbitmq     Up (healthy)    5672->5672, 15672->15672
```

#### Terminal 2: Start Auth Service (Port 3001)

```bash
cd auth-service
npm run start:dev
```

#### Terminal 3: Start AI Service (Port 3008)

```bash
cd ai-service
npx prisma migrate deploy
npm run start:dev
```

Expected output:
```
Gemini AI initialized with model: gemini-2.5-flash
AI Microservice is listening on RabbitMQ queue: ai_queue
```

#### Terminal 4: Start API Gateway (Port 3000)

```bash
cd api-gateway
npm run start:dev
```

### Option B: Docker Mode

```bash
# Set environment variables

# Windows PowerShell:
$env:GEMINI_API_KEY="your_api_key_here"
$env:GEMINI_MODEL="gemini-2.5-flash"

# Windows CMD:
set GEMINI_API_KEY=your_api_key_here
set GEMINI_MODEL=gemini-2.5-flash

# Linux/Mac:
export GEMINI_API_KEY="your_api_key_here"
export GEMINI_MODEL="gemini-2.5-flash"

# Start services
cd ai-service
docker-compose up -d --build
```

---

## Get Authentication Token

Before testing AI endpoints, you need a JWT token from the Auth Service.

### Login Request

**Auth Service Direct (Port 3001):**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"your_email@example.com\", \"password\": \"your_password\"}"
```

**Or via API Gateway (Port 3000):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"your_email@example.com\", \"password\": \"your_password\"}"
```

### Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** 
- Access token expires in **15 minutes**
- Save the `accessToken` for all subsequent API calls
- Get a new token if you receive "Unauthorized" errors

---

## Test All Endpoints

Replace `<ACCESS_TOKEN>` with your actual token in all commands below.

### Endpoints Overview

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/v1/ai/categorize` | POST | Auto-categorize expense |
| 2 | `/api/v1/ai/predict-spending` | GET | Predict future spending |
| 3 | `/api/v1/ai/anomalies` | GET | Detect unusual expenses |
| 4 | `/api/v1/ai/budget-alerts` | GET | Get budget alerts |
| 5 | `/api/v1/ai/assistant/chat` | POST | Chat with AI (Gemini) |
| 6 | `/api/v1/ai/insights` | GET | Get financial insights |

---

### 1. POST /api/v1/ai/categorize

Auto-categorize an expense based on description.

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/categorize ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>" ^
  -d "{\"description\": \"Coffee at Starbucks\", \"amount\": 50000}"
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| description | string | Yes | Expense description |
| amount | number | Yes | Amount in VND |
| spentAt | string | No | Date (ISO 8601) |
| merchantName | string | No | Merchant name |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "category": "food",
    "confidence": 0.3,
    "suggestedCategories": [
      { "category": "food", "confidence": 0.3 }
    ]
  }
}
```

---

### 2. GET /api/v1/ai/predict-spending

Predict future spending based on historical data.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai/predict-spending?period=month" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Query Parameters:**
| Parameter | Required | Values | Description |
|-----------|----------|--------|-------------|
| period | Yes | week, month, year | Prediction period |
| category | No | food, transport, etc. | Filter by category |
| startDate | No | ISO 8601 date | Start date |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "prediction": 25630000,
    "trend": "stable",
    "confidence": 0.3,
    "breakdown": [
      { "period": "2026-01", "amount": 25630000 }
    ]
  }
}
```

---

### 3. GET /api/v1/ai/anomalies

Detect unusual spending patterns.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai/anomalies" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| from | No | Start date (ISO 8601) |
| to | No | End date (ISO 8601) |
| category | No | Filter by category |
| threshold | No | Sensitivity 1-5 (default: 2.5) |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "expense": {
          "id": "xxx",
          "description": "Mua laptop",
          "amount": 25000000,
          "category": "shopping"
        },
        "reason": "Chi tieu vao gio bat thuong: 0:00",
        "severity": "low",
        "score": 1.5
      }
    ],
    "total": 5
  }
}
```

---

### 4. GET /api/v1/ai/budget-alerts

Get smart budget alerts.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai/budget-alerts" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "budgetId": "budget-123",
        "type": "warning",
        "message": "Da su dung 80% ngan sach",
        "severity": "warning",
        "percentage": 80
      }
    ],
    "total": 1
  }
}
```

---

### 5. POST /api/v1/ai/assistant/chat

Chat with AI financial assistant (powered by Google Gemini).

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/ai/assistant/chat ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>" ^
  -d "{\"message\": \"Lam sao de tiet kiem tien?\", \"includeContext\": true}"
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's question |
| conversationId | string | No | Continue existing conversation |
| includeContext | boolean | No | Include financial context (default: true) |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "response": "Chao ban! De tiet kiem tien hieu qua, FEPA co vai loi khuyen thuc te danh cho ban:\n\n1. **Lap Ngan sach Ngay:** Thiet lap han muc chi tieu cho tung danh muc...",
    "conversationId": "8c744873-0b8d-4eb1-83b0-4541005f3070"
  }
}
```

---

### 6. GET /api/v1/ai/insights

Get comprehensive financial insights.

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/ai/insights" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| period | No | Time period for analysis |

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "prediction",
        "title": "Du doan chi tieu thang toi",
        "description": "Du kien chi tieu: 25.630.000 VND",
        "data": { "prediction": 25630000, "trend": "stable" }
      },
      {
        "type": "anomalies",
        "title": "Phat hien bat thuong",
        "description": "Tim thay 5 giao dich bat thuong",
        "data": { "anomalies": [...], "total": 5 }
      }
    ],
    "total": 2
  }
}
```

---

## Quick Test Script

### Windows Batch Script (test-ai-endpoints.bat)

Create a file `test-ai-endpoints.bat` in the project root:

```batch
@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    FEPA AI Service - Endpoint Tests
echo ========================================
echo.

REM Configuration
set AUTH_URL=http://localhost:3001/api/v1/auth/login
set BASE_URL=http://localhost:3000/api/v1/ai
set EMAIL=your_email@example.com
set PASSWORD=your_password

echo [Step 1] Getting authentication token...
echo.

REM Get token
for /f "tokens=2 delims=:," %%a in ('curl -s -X POST %AUTH_URL% -H "Content-Type: application/json" -d "{\"email\": \"%EMAIL%\", \"password\": \"%PASSWORD%\"}" ^| findstr "accessToken"') do (
    set TOKEN=%%~a
)

REM Clean token (remove quotes and spaces)
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

if "%TOKEN%"=="" (
    echo ERROR: Failed to get token. Check credentials and auth-service.
    pause
    exit /b 1
)

echo Token obtained successfully!
echo.
echo ========================================
echo    Testing All Endpoints
echo ========================================
echo.

echo [1/6] POST /ai/categorize
echo ----------------------------------------
curl -s -X POST %BASE_URL%/categorize -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"description\": \"Coffee at Starbucks\", \"amount\": 50000}"
echo.
echo.

echo [2/6] GET /ai/predict-spending
echo ----------------------------------------
curl -s -X GET "%BASE_URL%/predict-spending?period=month" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo [3/6] GET /ai/anomalies
echo ----------------------------------------
curl -s -X GET "%BASE_URL%/anomalies" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo [4/6] GET /ai/budget-alerts
echo ----------------------------------------
curl -s -X GET "%BASE_URL%/budget-alerts" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo [5/6] POST /ai/assistant/chat
echo ----------------------------------------
curl -s -X POST %BASE_URL%/assistant/chat -H "Content-Type: application/json" -H "Authorization: Bearer %TOKEN%" -d "{\"message\": \"Hello, how can I save money?\"}"
echo.
echo.

echo [6/6] GET /ai/insights
echo ----------------------------------------
curl -s -X GET "%BASE_URL%/insights" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo ========================================
echo    All Tests Completed!
echo ========================================
pause
```

### Linux/Mac Shell Script (test-ai-endpoints.sh)

```bash
#!/bin/bash

echo "========================================"
echo "   FEPA AI Service - Endpoint Tests"
echo "========================================"
echo

# Configuration
AUTH_URL="http://localhost:3001/api/v1/auth/login"
BASE_URL="http://localhost:3000/api/v1/ai"
EMAIL="your_email@example.com"
PASSWORD="your_password"

echo "[Step 1] Getting authentication token..."
echo

# Get token
RESPONSE=$(curl -s -X POST $AUTH_URL \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "ERROR: Failed to get token. Check credentials and auth-service."
    exit 1
fi

echo "Token obtained successfully!"
echo
echo "========================================"
echo "   Testing All Endpoints"
echo "========================================"
echo

echo "[1/6] POST /ai/categorize"
echo "----------------------------------------"
curl -s -X POST $BASE_URL/categorize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"description": "Coffee at Starbucks", "amount": 50000}'
echo -e "\n"

echo "[2/6] GET /ai/predict-spending"
echo "----------------------------------------"
curl -s -X GET "$BASE_URL/predict-spending?period=month" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "[3/6] GET /ai/anomalies"
echo "----------------------------------------"
curl -s -X GET "$BASE_URL/anomalies" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "[4/6] GET /ai/budget-alerts"
echo "----------------------------------------"
curl -s -X GET "$BASE_URL/budget-alerts" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "[5/6] POST /ai/assistant/chat"
echo "----------------------------------------"
curl -s -X POST $BASE_URL/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Hello, how can I save money?"}'
echo -e "\n"

echo "[6/6] GET /ai/insights"
echo "----------------------------------------"
curl -s -X GET "$BASE_URL/insights" \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "========================================"
echo "   All Tests Completed!"
echo "========================================"
```

---

## Troubleshooting

### Error: "Unauthorized"

**Cause:** Token expired (tokens expire in 15 minutes)

**Solution:** Get a new token by logging in again:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"your_email\", \"password\": \"your_password\"}"
```

---

### Error: "Xin loi, da co loi xay ra khi xu ly yeu cau cua ban"

**Cause:** Gemini API issue (usually wrong model or quota exceeded)

**Solution:**

1. **Check model configuration:**
   ```bash
   # In ai-service/.env, ensure:
   GEMINI_MODEL=gemini-2.5-flash
   ```

2. **Verify API key works:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" ^
     -H "Content-Type: application/json" ^
     -d "{\"contents\":[{\"parts\":[{\"text\":\"Hello\"}]}]}"
   ```

3. **If using Docker, add GEMINI_MODEL to docker-compose.yml:**
   ```yaml
   environment:
     - GEMINI_MODEL=gemini-2.5-flash
   ```

4. **Restart the ai-service after changes**

---

### Error: "Cannot connect to RabbitMQ"

**Cause:** RabbitMQ not running

**Solution:**
```bash
cd deployment
docker-compose up -d rabbitmq
docker ps | findstr rabbitmq
```

---

### Error: "Database connection failed"

**Cause:** PostgreSQL not running or database not created

**Solution:**
```bash
cd deployment
docker-compose up -d postgres

cd ../ai-service
npx prisma migrate deploy
```

---

### Error: "GEMINI_API_KEY not configured"

**Cause:** Missing API key in environment

**Solution:**
1. Add `GEMINI_API_KEY` to `.env` file
2. If using Docker, add to `docker-compose.yml` environment section
3. Restart the service

---

### View Logs

```bash
# AI Service logs
docker logs ai-service -f

# Or if running in dev mode, check the terminal output

# Check RabbitMQ management console
# Open: http://localhost:15672
# Login: fepa / fepa123
```

---

## Test Results Checklist

| # | Endpoint | Expected Result | Status |
|---|----------|-----------------|--------|
| 1 | `/ai/categorize` | Returns category with confidence | [ ] |
| 2 | `/ai/predict-spending` | Returns prediction with trend | [ ] |
| 3 | `/ai/anomalies` | Returns anomalies array | [ ] |
| 4 | `/ai/budget-alerts` | Returns alerts array | [ ] |
| 5 | `/ai/assistant/chat` | Returns AI response | [ ] |
| 6 | `/ai/insights` | Returns insights array | [ ] |

---

## Version Info

| Field | Value |
|-------|-------|
| Document Version | 3.1.0 |
| Last Updated | 2026-01-17 |
| Tested Models | gemini-2.5-flash |
| Node.js | v20+ |
| NestJS | v10 |
| Tested On | Windows 11, Docker Desktop |
