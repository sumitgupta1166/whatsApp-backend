import Message from '../models/message.model.js';
import { getIO } from '../sockets/socket.js';

export async function handleWebhook(req, res, next) {
  try {
    const payload = req.body;
    await processWebhookPayload(payload);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function processWebhookPayload(payload) {
  if (!payload || !payload.metaData) return;

  const md = payload.metaData;
  if (!Array.isArray(md.entry)) return;

  for (const entry of md.entry) {
    if (!Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      const value = change.value;
      if (!value) continue;

      if (Array.isArray(value.messages)) {
        for (const m of value.messages) {
          await upsertMessageFromMessageObject(m, value, payload);
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses) {
          await applyStatusToMessage(s);
        }
      }
    }
  }
}

async function upsertMessageFromMessageObject(m, valueBlock, payloadRoot) {
  const msgId = m.id || null;
  const from = m.from || null;
  const businessNumber = (valueBlock.metadata && valueBlock.metadata.display_phone_number) || process.env.BUSINESS_PHONE || null;
  const wa_id = (valueBlock.contacts && valueBlock.contacts[0] && valueBlock.contacts[0].wa_id) || from;
  const name = (valueBlock.contacts && valueBlock.contacts[0] && valueBlock.contacts[0].profile && valueBlock.contacts[0].profile.name) || null;
  const text = (m.text && m.text.body) || null;
  const type = m.type || 'text';
  const timestamp = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();
  const direction = (String(from) === String(businessNumber)) ? 'outgoing' : 'incoming';

  const query = { $or: [{ msgId }, { meta_msg_id: msgId }] };
  const update = {
    $setOnInsert: {
      msgId,
      meta_msg_id: msgId,
      from,
      to: businessNumber,
      wa_id,
      name,
      text,
      type,
      timestamp,
      raw: { payloadRoot, valueBlock, messageObject: m }
    },
    $set: {
      status: 'unknown'
    }
  };

  const res = await Message.updateOne(query, update, { upsert: true });

  if (res.upserted) {
    const saved = await Message.findOne({ $or: [{ msgId }, { meta_msg_id: msgId }] }).lean();
    try {
      const io = getIO();
      if (io) io.emit('new_message', saved);
    } catch (e) {
      // socket not initialized, ignore
    }
  }
}

async function applyStatusToMessage(s) {
  const id = s.id || s.meta_msg_id || s.gs_id;
  const status = s.status || 'unknown';
  const found = await Message.findOneAndUpdate(
    { $or: [{ msgId: id }, { meta_msg_id: id }] },
    { $set: { status, updatedAt: new Date() } },
    { new: true }
  );
  if (found) {
    try {
      const io = getIO();
      if (io) io.emit('message_status_update', { msgId: id, status });
    } catch (e) {
      // socket not initialized
    }
  }
}
