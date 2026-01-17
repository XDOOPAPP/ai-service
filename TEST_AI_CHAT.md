# Test AI Assistant Chat

## Bước 1: Lấy JWT Token (nếu chưa có)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Lưu `access_token` vào biến:
```powershell
$TOKEN = "your_access_token_here"
```

## Bước 2: Test AI Chat

```bash
curl -X POST http://localhost:3000/api/v1/ai/assistant/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào, bạn có thể giúp tôi quản lý chi tiêu không?","includeContext":true}'
```

## Expected Response

```json
{
  "success": true,
  "data": {
    "response": "Chào bạn! Tôi là trợ lý tài chính của FEPA...",
    "conversationId": "uuid-here"
  }
}
```

## Nếu vẫn lỗi

1. Check logs:
```bash
docker logs ai-service -f
```

2. Verify API key:
```bash
docker exec ai-service printenv | findstr GEMINI
```

3. Restart container:
```bash
docker-compose restart ai-service
```
