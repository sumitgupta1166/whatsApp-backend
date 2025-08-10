import express from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';
import { getConversations, getConversationMessages, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

app.get("/", (req, res) => {
  res.send("Backend API is running");
});
router.post('/webhook', handleWebhook);
router.get('/conversations', getConversations);
router.get('/conversations/:waId/messages', getConversationMessages);
router.post('/messages', sendMessage);

export default router;
