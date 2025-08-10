// processPayloads.js
import fs from 'fs';
import path from 'path';
import { Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { DB_NAME } from './src/constants.js';
// Load .env variables
dotenv.config({ path: './.env' });

const __dirname = path.resolve();
const payloadDir = path.join(__dirname, 'payloads'); 

// MongoDB connection
const MONGO_URI = process.env.MONGODB_URI ;
// const DB_NAME = DB_NAME || 'whatsapp';
const COLLECTION_NAME = 'processed_messages';

async function processPayloads() {
  const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} payload files`);

    for (const file of files) {
      const filePath = path.join(payloadDir, file);
      const rawData = fs.readFileSync(filePath, 'utf8');
      const payload = JSON.parse(rawData);

      // Handle incoming/outgoing messages
      if (payload.messages) {
        for (const msg of payload.messages) {
          await collection.updateOne(
            { id: msg.id },
            {
              $setOnInsert: {
                id: msg.id,
                from: msg.from,
                to: msg.to || null,
                text: msg.text?.body || null,
                timestamp: new Date(parseInt(msg.timestamp) * 1000),
                status: 'sent',
                wa_id: msg.from || msg.to,
              },
            },
            { upsert: true }
          );
        }
        console.log(`💬 Inserted/Updated messages from ${file}`);
      }

      // Handle status updates
      if (payload.statuses) {
        for (const status of payload.statuses) {
          await collection.updateOne(
            { id: status.id },
            { $set: { status: status.status } }
          );
        }
        console.log(`📌 Updated statuses from ${file}`);
      }
    }

    console.log('✅ All payloads processed successfully');
  } catch (err) {
    console.error('❌ Error processing payloads', err);
  } finally {
    await client.close();
  }
}

processPayloads();
