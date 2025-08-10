import express from 'express';
import Message from '../models/message.model.js';

const router = express.Router();

// alias for conversations list - /api/chats
router.get('/chats', async (req, res) => {
  try {
    const agg = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: '$wa_id',
        name: { $first: '$name' },
        latestMessage: { $first: '$text' },
        latestTimestamp: { $first: '$timestamp' },
        lastStatus: { $first: '$status' },
        lastMsgId: { $first: '$msgId' }
      }},
      { $sort: { latestTimestamp: -1 } }
    ]);
    const chats = agg.map(a => ({
      wa_id: a._id,
      name: a.name,
      latestMessage: a.latestMessage,
      latestTimestamp: a.latestTimestamp,
      lastStatus: a.lastStatus,
      lastMsgId: a.lastMsgId
    }));
    res.json(chats);
  } catch (err) {
    console.error('GET /api/chats error', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// alias for messages - /api/messages/:wa_id
router.get('/messages/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const msgs = await Message.find({ wa_id }).sort({ timestamp: 1 }).lean();
    res.json(msgs);
  } catch (err) {
    console.error('GET /api/messages/:wa_id error', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
