# Evolution WhatsApp API Documentation

## Base URL
```
http://QR.365whatsapp.com
```

## Authentication

### For POS Integration (Server 2 Format)
Use `instance_id` and `access_token` as query parameters.

### For Web Admin
Use JWT Bearer token in Authorization header.

---

## 1. Send Message (POS Integration)

### Endpoint
```
GET /api/pos/send
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| number | string | Yes | Phone number with country code (e.g., 60125600315) |
| type | string | Yes | Message type: `text` |
| message | string | Yes | Message content |
| instance_id | string | Yes | Your instance ID from dashboard |
| access_token | string | Yes | Your access token from dashboard |

### Example Request
```bash
curl "http://QR.365whatsapp.com/api/pos/send?number=60125600315&type=text&message=hello&instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"
```

### Example Response (Success)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "number": "60125600315",
    "type": "text",
    "messageId": "ABC123DEF456"
  }
}
```

### Example Response (Error)
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 2. Check Connection Status

### Endpoint
```
GET /api/pos/status
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| instance_id | string | Yes | Your instance ID |
| access_token | string | Yes | Your access token |

### Example Request
```bash
curl "http://QR.365whatsapp.com/api/pos/status?instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"
```

### Example Response
```json
{
  "success": true,
  "status": "open",
  "instanceName": "inst_username"
}
```

**Status Values:**
- `open` - Connected and ready
- `connecting` - Connecting to WhatsApp
- `close` - Disconnected

---

## 3. Create Instance (Admin Only)

### Endpoint
```
POST /api/web/users
```

### Headers
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Request Body
```json
{
  "username": "merchant001",
  "password": "securepassword123",
  "role": "user"
}
```

### Example Request
```bash
curl -X POST "http://QR.365whatsapp.com/api/web/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "merchant001",
    "password": "securepassword123",
    "role": "user"
  }'
```

### Example Response
```json
{
  "user": {
    "id": 1,
    "username": "merchant001",
    "role": "user",
    "instanceName": "inst_merchant001",
    "posMapping": {
      "instanceId": "131A4DAC3D9B4",
      "accessToken": "75a65a1b69b24"
    }
  }
}
```

---

## 4. Login (Get JWT Token)

### Endpoint
```
POST /api/web/auth/login
```

### Request Body
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

### Example Request
```bash
curl -X POST "http://QR.365whatsapp.com/api/web/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "yourpassword"
  }'
```

### Example Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

## 5. Get QR Code for Binding

### Web UI URL
```
http://QR.365whatsapp.com/instances/{instance_name}/bind
```

### Example
```
http://QR.365whatsapp.com/instances/inst_merchant001/bind
```

The page will:
1. Display QR code
2. Auto-refresh every 30 seconds
3. Show "Connected" status when scanned

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing parameters |
| 401 | Unauthorized - Invalid credentials |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Instance not found |
| 500 | Server Error |

---

## Postman Collection

### Import URL
```
https://raw.githubusercontent.com/Iceshen87/evolution-whatsapp/main/docs/postman-collection.json
```

### Environment Variables
```json
{
  "base_url": "http://QR.365whatsapp.com",
  "instance_id": "YOUR_INSTANCE_ID",
  "access_token": "YOUR_ACCESS_TOKEN"
}
```
