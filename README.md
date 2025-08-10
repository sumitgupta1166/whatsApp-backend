# WhatsApp Backend - Fixed

This backend includes alias routes `/api/chats` and `/api/messages/:wa_id` to match frontend expectations,
alongside the original `/api/conversations` endpoints. Includes CORS and Socket.IO support.

## Run locally
1. Copy `.env.sample` to `.env` and set `MONGODB_URI`
2. npm install
3. npm run dev

## Endpoints
- POST /api/webhook
- GET  /api/conversations
- GET  /api/conversations/:waId/messages
- POST /api/messages
- GET  /api/chats  (alias)
- GET  /api/messages/:wa_id  (alias)
