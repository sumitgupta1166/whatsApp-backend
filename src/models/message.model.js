import mongoose from 'mongoose';
import { PROCESSED_COLLECTION } from '../constants.js';
const { Schema } = mongoose;
const MessageSchema = new Schema({
  msgId: { type: String, index: true, sparse: true },
  meta_msg_id: { type: String, index: true, sparse: true },
  from: String,
  to: String,
  wa_id: { type: String, index: true },
  name: String,
  text: String,
  type: String,
  timestamp: Date,
  status: { type: String, enum: ['sent', 'delivered', 'read', 'unknown'], default: 'unknown' },
  direction: { type: String, enum: ['incoming', 'outgoing'], default: 'incoming' },
  raw: Object
}, {
  collection: PROCESSED_COLLECTION,
  timestamps: true
});
export default mongoose.model('Message', MessageSchema);
