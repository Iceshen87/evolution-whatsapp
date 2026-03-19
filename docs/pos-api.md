# POS System API Integration Guide

## Overview

This document describes how to integrate your POS system with the WhatsApp Manager API
to send WhatsApp messages. The API supports **two endpoint formats**, matching both of the
client's existing servers (ai.365ws.com and ccs.365ws.com).

---

## Base URL

```
https://YOUR_DOMAIN/api/pos
```

Replace `YOUR_DOMAIN` with the actual domain configured for your deployment.

---

## Endpoints

### Endpoint 1: Send Message (ai.365ws.com style)

Replaces: `http://ai.365ws.com/api/create-message?appkey=...&authkey=...&to=...&message=...`

**Request:**

```
GET /api/pos/create-message?appkey=APP_KEY&authkey=AUTH_KEY&to=PHONE_NUMBER&message=MESSAGE_TEXT
```

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `appkey`  | string | Yes      | Application key (from admin panel) |
| `authkey` | string | Yes      | Authentication key (from admin panel) |
| `to`      | string | Yes      | Recipient phone number with country code, no `+`. Example: `60175731432` |
| `message` | string | Yes      | The text message to send |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "to": "60175731432",
    "messageId": "3EB0ABC123..."
  }
}
```

**Example (cURL):**

```bash
curl "https://YOUR_DOMAIN/api/pos/create-message?appkey=abc123def456&authkey=xyz789ghi012&to=60175731432&message=Hello%20from%20POS"
```

---

### Endpoint 2: Send Message (ccs.365ws.com style)

Replaces: `https://ccs.365ws.com/api/send?number=...&type=text&message=...&instance_id=...&access_token=...`

**Request:**

```
GET /api/pos/send?number=PHONE_NUMBER&type=text&message=MESSAGE_TEXT&instance_id=INSTANCE_ID&access_token=ACCESS_TOKEN
```

| Parameter      | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `instance_id`  | string | Yes      | Instance ID (from admin panel) |
| `access_token` | string | Yes      | Access token (from admin panel) |
| `number`       | string | Yes      | Recipient phone number with country code, no `+`. Example: `60125600315` |
| `type`         | string | No       | Message type. Currently only `text` is supported |
| `message`      | string | Yes      | The text message to send |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "number": "60125600315",
    "type": "text",
    "messageId": "3EB0ABC123..."
  }
}
```

**Example (cURL):**

```bash
curl "https://YOUR_DOMAIN/api/pos/send?number=60125600315&type=text&message=hello&instance_id=ABC123DEF4567&access_token=abc123def4567"
```

---

### Endpoint 3: Check Connection Status

Check whether the WhatsApp instance is connected and ready to send messages.
Works with **either** credential format.

**Request (format 1):**

```
GET /api/pos/status?appkey=APP_KEY&authkey=AUTH_KEY
```

**Request (format 2):**

```
GET /api/pos/status?instance_id=INSTANCE_ID&access_token=ACCESS_TOKEN
```

**Success Response (200):**

```json
{
  "success": true,
  "status": "open",
  "instanceName": "inst_johndoe"
}
```

| Status | Meaning |
|--------|---------|
| `open` | Connected and ready to send messages |
| `connecting` | Attempting to connect |
| `close` | Disconnected |
| `no_instance` | No WhatsApp instance assigned |

---

## Error Responses (all endpoints)

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{"success": false, "error": "Missing ..."}` | Missing required parameters |
| 401 | `{"success": false, "error": "Invalid credentials"}` | Wrong credentials or inactive account |
| 400 | `{"success": false, "error": "No WhatsApp instance bound..."}` | User has not scanned QR yet |
| 500 | `{"success": false, "error": "Failed to send message"}` | WhatsApp connection issue |

---

## Migration from Waziper (365ws.com)

### Server 1 Migration (ai.365ws.com)

| | Old | New |
|---|---|---|
| **URL** | `http://ai.365ws.com/api/create-message` | `https://YOUR_DOMAIN/api/pos/create-message` |
| **appkey** | old appkey | new appkey from admin panel |
| **authkey** | old authkey | new authkey from admin panel |
| **to** | same | same |
| **message** | same | same |

**POS changes needed:** Change base URL, add `/pos` to path, update appkey/authkey.

### Server 2 Migration (ccs.365ws.com)

| | Old | New |
|---|---|---|
| **URL** | `https://ccs.365ws.com/api/send` | `https://YOUR_DOMAIN/api/pos/send` |
| **instance_id** | old instance_id | new instance_id from admin panel |
| **access_token** | old access_token | new access_token from admin panel |
| **number** | same | same |
| **type** | same | same |
| **message** | same | same |

**POS changes needed:** Change base URL, add `/pos` to path, update instance_id/access_token.

---

## Credentials

When an admin creates a user in the Web panel, the system auto-generates **4 credentials**:

| Credential | Used by |
|------------|---------|
| `appkey` | Server 1 style (`/api/pos/create-message`) |
| `authkey` | Server 1 style (`/api/pos/create-message`) |
| `instance_id` | Server 2 style (`/api/pos/send`) |
| `access_token` | Server 2 style (`/api/pos/send`) |

All credentials can be viewed and copied from the admin panel's Users page.

---

## Setup Workflow

1. Admin creates a user account in the Web panel (credentials are auto-generated)
2. User logs into the Web panel and scans the QR code to bind WhatsApp
3. Once connected (status = `open`), the POS system can start sending messages
4. Configure POS with the appropriate endpoint URL + credentials

---

## Rate Limits

- POS API: 10 requests/second per IP address (burst up to 20)
- If you exceed the limit, you will receive HTTP 429 (Too Many Requests)
