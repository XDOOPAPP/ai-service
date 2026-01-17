# FEPA AI Service - Hướng Dẫn Đầy Đủ

## 📋 Mục Lục
1. [Giới thiệu](#giới-thiệu)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt từ đầu](#cài-đặt-từ-đầu)
4. [Cấu hình](#cấu-hình)
5. [Chạy Development](#chạy-development)
6. [Chạy Production với Docker](#chạy-production-với-docker)
7. [API Endpoints](#api-endpoints)
8. [Test với Postman](#test-với-postman)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới thiệu

AI Service là một phần của hệ thống FEPA (Financial Expense Personal Assistant) cung cấp các tính năng AI:

### Tính năng chính:
- ✅ **Auto Categorization**: Tự động phân loại chi tiêu
- ✅ **Spending Prediction**: Dự đoán chi tiêu tương lai
- ✅ **Anomaly Detection**: Phát hiện chi tiêu bất thường
- ✅ **Budget Alerts**: Cảnh báo ngân sách thông minh
- ✅ **AI Assistant**: Trợ lý tài chính với Gemini 2.0

---

## 💻 Yêu cầu hệ thống

- **Node.js**: v20 trở lên
- **npm**: v10 trở lên
- **Docker Desktop**: Latest version (cho production)
- **PostgreSQL**: v15 (hoặc dùng Docker)
- **RabbitMQ**: v3.12 (hoặc dùng Docker)

---

## 🚀 Cài đặt từ đầu

### Bước 1: Clone repository

```bash
# Clone project
git clone <repository-url>
cd FEPA

# Hoặc nếu đã có code
cd d:/FEPA
```

### Bước 2: Cài đặt dependencies cho AI Service

```bash
cd ai-service
npm install --legacy-peer-deps
```

**Lưu ý**: Dùng `--legacy-peer-deps` để tránh conflict dependencies.

### Bước 3: Cài đặt Prisma Client

```bash
npx prisma generate
```

---

## ⚙️ Cấu hình

### 1. Tạo file .env

```bash
cp .env.example .env
```

### 2. Chỉnh sửa file .env

Mở file `.env` và cập nhật các giá trị:

```env
# Database (Development - Local)
DATABASE_URL="postgresql://fepa:fepa123@localhost:5432/fepa_ai?schema=public"

# RabbitMQ (Development - Local)
RABBITMQ_URL=amqp://localhost:5672

# Gemini API Key (BẮT BUỘC)
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# AI Configuration
AI_CONFIDENCE_THRESHOLD=0.7
ANOMALY_ZSCORE_THRESHOLD=2.5
BUDGET_ALERT_THRESHOLDS=50,80,100
```

### 3. Lấy Gemini API Key (QUAN TRỌNG!)

**Bước 1**: Truy cập https://makersuite.google.com/app/apikey

**Bước 2**: Đăng nhập bằng Google Account

**Bước 3**: Click "Create API Key"

**Bước 4**: Copy API key và paste vào file `.env`:
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Lưu ý**: Không commit API key lên Git!

---

## 🔧 Chạy Development

### Bước 1: Start Infrastructure Services

```bash
# Mở terminal mới, chạy infrastructure
cd d:/FEPA/deployment
docker-compose up -d

# Kiểm tra services đã chạy
docker-compose ps
```

Kết quả mong đợi:
```
NAME                STATUS              PORTS
fepa-mongodb        Up (healthy)        27017->27017
fepa-postgres       Up (healthy)        5432->5432
fepa-rabbitmq       Up (healthy)        5672->5672, 15672->15672
```

### Bước 2: Chạy Database Migration

```bash
cd d:/FEPA/ai-service

# Tạo migration
npx prisma migrate dev --name init

# Hoặc nếu đã có migration
npx prisma migrate deploy
```

### Bước 3: Start AI Service

```bash
npm run start:dev
```

Kết quả mong đợi:
```
🚀 AI Microservice is listening on RabbitMQ queue: ai_queue
Gemini AI initialized with model: gemini-2.0-flash-exp
```

### Bước 4: Start API Gateway (Terminal mới)

```bash
cd d:/FEPA/api-gateway
npm run start:dev
```

### Bước 5: Start các services khác (nếu cần)

```bash
# Expense Service
cd d:/FEPA/expense-service
npm run start:dev

# Budget Service
cd d:/FEPA/budget-service
npm run start:dev
```

---

## 🐳 Chạy Production với Docker

### Bước 1: Start Infrastructure

```bash
cd d:/FEPA/deployment
docker-compose up -d
```

### Bước 2: Set Gemini API Key

**PowerShell:**
```powershell
$env:GEMINI_API_KEY="your_actual_api_key_here"
```

**CMD:**
```cmd
set GEMINI_API_KEY=your_actual_api_key_here
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="your_actual_api_key_here"
```

### Bước 3: Build và Deploy AI Service

```bash
cd d:/FEPA/ai-service

# Build và start
docker-compose -f docker-compose.ai.yml up -d --build

# Xem logs
docker logs fepa-ai-service -f
```

### Bước 4: Verify Deployment

```bash
# Kiểm tra container đang chạy
docker ps | grep fepa-ai-service

# Kiểm tra database migration
docker exec fepa-ai-service npx prisma migrate status

# Kiểm tra RabbitMQ queues
# Mở browser: http://localhost:15672
# Login: fepa / fepa123
# Verify 'ai_queue' tồn tại
```

---

## 📡 API Endpoints

**Base URL**: `http://localhost:3000` (API Gateway)

**Authentication**: Tất cả endpoints cần JWT token trong header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Auto Categorization

**Endpoint**: `POST /ai/categorize`

**Description**: Tự động phân loại chi tiêu dựa trên mô tả

**Request Body**:
```json
{
  "description": "Ăn phở tại quán Phở Hà Nội",
  "amount": 50000
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "category": "food",
    "confidence": 0.85,
    "suggestedCategories": [
      { "category": "food", "confidence": 0.85 },
      { "category": "other", "confidence": 0.3 }
    ]
  }
}
```

### 2. Spending Prediction

**Endpoint**: `GET /ai/predict-spending`

**Description**: Dự đoán chi tiêu tương lai

**Query Parameters**:
- `period` (required): `week` | `month` | `year`
- `category` (optional): `food`, `transport`, `shopping`, etc.

**Example**:
```
GET /ai/predict-spending?period=month&category=food
```

**Response**:
```json
{
  "success": true,
  "data": {
    "prediction": 5000000,
    "trend": "increasing",
    "confidence": 0.75,
    "breakdown": [
      { "period": "2026-01", "amount": 4500000 },
      { "period": "2026-02", "amount": 4800000 }
    ]
  }
}
```

### 3. Anomaly Detection

**Endpoint**: `GET /ai/anomalies`

**Description**: Phát hiện chi tiêu bất thường

**Query Parameters**:
- `from` (optional): Ngày bắt đầu (ISO 8601), ví dụ: `2026-01-01`
- `to` (optional): Ngày kết thúc (ISO 8601), ví dụ: `2026-01-31`
- `category` (optional): Lọc theo category
- `threshold` (optional): Độ nhạy 1-5 (default: 2.5)

**Example**:
```
GET /ai/anomalies?from=2026-01-01&to=2026-01-31&threshold=2.5
```

**Response**:
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "expense": {
          "id": "xxx",
          "description": "Mua laptop",
          "amount": 25000000
        },
        "reason": "Chi tiêu bất thường: 25,000,000 VND (cao hơn 3 lần độ lệch chuẩn)",
        "severity": "high",
        "score": 3.5
      }
    ],
    "total": 1
  }
}
```

### 4. Budget Alerts

**Endpoint**: `GET /ai/budget-alerts`

**Description**: Lấy cảnh báo ngân sách thông minh

**Example**:
```
GET /ai/budget-alerts
```

**Response**:
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "budgetId": "budget-123",
        "type": "warning",
        "message": "Đã sử dụng 80% ngân sách \"Ăn uống tháng 1\"",
        "severity": "warning",
        "percentage": 80
      },
      {
        "budgetId": "budget-456",
        "type": "critical",
        "message": "Vượt ngân sách \"Mua sắm\": 500,000 VND (105%)",
        "severity": "critical",
        "percentage": 105
      }
    ],
    "total": 2
  }
}
```

### 5. AI Assistant Chat

**Endpoint**: `POST /ai/assistant/chat`

**Description**: Chat với AI trợ lý tài chính (Gemini 2.0)

**Request Body**:
```json
{
  "message": "Tôi nên tiết kiệm như thế nào?",
  "conversationId": "optional-conversation-id",
  "includeContext": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "response": "Dựa trên chi tiêu của bạn trong tháng này (5,000,000 VND), tôi nhận thấy bạn chi nhiều nhất cho ăn uống (2,000,000 VND). Đây là một số gợi ý:\n\n1. Nấu ăn tại nhà thay vì ăn ngoài\n2. Lập kế hoạch mua sắm hàng tuần\n3. Đặt mục tiêu tiết kiệm 20% thu nhập\n\nBạn có muốn tôi tạo ngân sách chi tiết không?",
    "conversationId": "conv-789"
  }
}
```

### 6. Get Insights

**Endpoint**: `GET /ai/insights`

**Description**: Lấy tổng hợp insights về tài chính

**Query Parameters**:
- `period` (optional): Khoảng thời gian phân tích

**Example**:
```
GET /ai/insights
```

**Response**:
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "prediction",
        "title": "Dự đoán chi tiêu tháng tới",
        "description": "Dự kiến chi tiêu: 5,000,000 VND",
        "data": { "prediction": 5000000, "trend": "increasing" }
      },
      {
        "type": "anomalies",
        "title": "Phát hiện bất thường",
        "description": "Tìm thấy 2 giao dịch bất thường",
        "data": { "anomalies": [...], "total": 2 }
      },
      {
        "type": "alerts",
        "title": "Cảnh báo ngân sách",
        "description": "Có 1 cảnh báo cần chú ý",
        "data": { "alerts": [...], "total": 1 }
      }
    ],
    "total": 3
  }
}
```

---

## 🧪 Test với Postman

### Bước 1: Lấy JWT Token

**Request**: `POST http://localhost:3000/api/v1/auth/login`

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Bước 2: Set Authorization Header

Trong Postman:
1. Chọn tab "Authorization"
2. Type: "Bearer Token"
3. Token: Paste `access_token` từ bước 1

### Bước 3: Test Categorization

**Request**: `POST http://localhost:3000/api/v1/ai/categorize`

**Headers**:
```
Authorization: Bearer <your_token>
Content-Type: application/json
```

**Body**:
```json
{
  "description": "Grab đi làm",
  "amount": 35000
}
```

**Expected**: Category = "transport", confidence > 0.7

### Bước 4: Test AI Assistant

**Request**: `POST http://localhost:3000/api/v1/ai/assistant/chat`

**Body**:
```json
{
  "message": "Phân tích chi tiêu của tôi",
  "includeContext": true
}
```

**Expected**: Nhận được response từ Gemini AI

---

## 🐛 Troubleshooting

### Lỗi: "GEMINI_API_KEY not configured"

**Nguyên nhân**: Chưa set API key

**Giải pháp**:
1. Lấy API key tại: https://makersuite.google.com/app/apikey
2. Thêm vào file `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. Restart service

### Lỗi: "Cannot connect to RabbitMQ"

**Nguyên nhân**: RabbitMQ chưa chạy

**Giải pháp**:
```bash
cd d:/FEPA/deployment
docker-compose up -d rabbitmq

# Verify
docker ps | grep rabbitmq
```

### Lỗi: "Database connection failed"

**Nguyên nhân**: PostgreSQL chưa chạy hoặc database chưa tạo

**Giải pháp**:
```bash
# Start PostgreSQL
cd d:/FEPA/deployment
docker-compose up -d postgres

# Chạy migration
cd d:/FEPA/ai-service
npx prisma migrate deploy
```

### Lỗi: "npm install failed"

**Nguyên nhân**: Dependency conflicts

**Giải pháp**:
```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Install lại với legacy-peer-deps
npm install --legacy-peer-deps
```

### Lỗi: "Không thể dự đoán chi tiêu"

**Nguyên nhân**: Chưa có đủ dữ liệu (cần ít nhất 3 expenses)

**Giải pháp**: Thêm expenses qua expense-service trước

### AI Assistant trả về lỗi

**Nguyên nhân**: 
- API key không hợp lệ
- Hết quota Gemini API
- Network issues

**Giải pháp**:
1. Verify API key tại Google AI Studio
2. Check quota: https://makersuite.google.com/app/apikey
3. Xem logs: `docker logs fepa-ai-service`

---

## 📚 Tài liệu tham khảo

- **Gemini API**: https://ai.google.dev/docs
- **NestJS**: https://docs.nestjs.com
- **Prisma**: https://www.prisma.io/docs
- **RabbitMQ**: https://www.rabbitmq.com/documentation.html

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check logs: `docker logs fepa-ai-service`
2. Check RabbitMQ: http://localhost:15672
3. Check database: `npx prisma studio`

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-11

