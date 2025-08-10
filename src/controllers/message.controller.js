import Message from '../models/message.model.js';
import { getIO } from '../sockets/socket.js';

export async function getConversations(req, res, next) {
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
    res.json(agg);
  } catch (err) { next(err); }
}

export async function getConversationMessages(req, res, next) {
  try {
    const { waId } = req.params;
    const msgs = await Message.find({ wa_id: waId }).sort({ timestamp: 1 }).lean();
    res.json(msgs);
  } catch (err) { next(err); }
}

export async function sendMessage(req, res, next) {
  try {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: 'to and text required' });

    const now = Date.now();
    const msg = await Message.create({
      msgId: `local-${now}`,
      meta_msg_id: `local-${now}`,
      from: process.env.BUSINESS_PHONE || 'biz_number',
      to,
      wa_id: to,
      name: null,
      text,
      type: 'text',
      timestamp: new Date(),
      status: 'sent',
      direction: 'outgoing',
      raw: { note: 'created-by-local-api' }
    });

    try {
      const io = getIO();
      if (io) io.emit('new_message', msg);
    } catch (e) { /* ignore if no socket */ }

    res.status(201).json(msg);
  } catch (err) { next(err); }
}
