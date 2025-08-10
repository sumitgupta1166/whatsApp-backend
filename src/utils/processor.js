import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { connectDB } from '../db/index.js';
import { processWebhookPayload } from '../controllers/webhook.controller.js';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is required in .env');
    process.exit(1);
  }
  await connectDB();

  const dirArg = process.argv[2] || 'payloads';
  const dir = path.isAbsolute(dirArg) ? dirArg : path.join(process.cwd(), dirArg);

  if (!fs.existsSync(dir)) {
    console.error('Payload directory not found:', dir);
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No JSON files in', dir);
    process.exit(0);
  }

  for (const f of files) {
    const full = path.join(dir, f);
    try {
      const text = fs.readFileSync(full, 'utf8');
      const payload = JSON.parse(text);
      console.log('Processing', f);
      await processWebhookPayload(payload);
    } catch (err) {
      console.error('Error processing', f, err.message);
    }
  }

  console.log('Processing done');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
