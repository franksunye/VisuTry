import { ImapFlow } from 'imapflow';
import fs from 'fs';

async function fetchEmails() {
  const user = process.env.EXMAIL_USER;
  const pass = process.env.EXMAIL_PASS;

  if (!user || !pass) {
    console.error('Error: EXMAIL_USER or EXMAIL_PASS not found in environment.');
    process.exit(1);
  }

  const client = new ImapFlow({
    host: 'imap.exmail.qq.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to IMAP server');

    let lock = await client.getMailboxLock('INBOX');
    try {
      console.log('📥 Fetching recent emails...');
      
      const messages = [];
      // Fetch latest 10 messages
      for await (let message of client.fetch({seq: '1:*'}, { envelope: true })) {
        messages.push(message.envelope);
      }
      
      const latest = messages.slice(-10).reverse();
      latest.forEach((env, i) => {
        console.log(`[${i+1}] From: ${env.from[0].address} | Subject: ${env.subject}`);
      });
      console.log('Done mapping initial envelope structure.');
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error('❌ Failed to fetch emails:', error);
  } finally {
    await client.logout();
  }
}

fetchEmails();
