import { runMailCli } from '../../../../scripts/mail';

const args = process.argv.slice(2);

if (args.length < 4) {
  console.error('Usage: npx tsx send.ts <from_email> <to_email> <subject> <body> [in_reply_to_message_id]');
  process.exit(1);
}

const [fromEmail, to, subject, body, inReplyTo] = args;
const normalizedArgs = [
  'send',
  '--from-email',
  fromEmail,
  '--to',
  to,
  '--subject',
  subject,
  '--body',
  body,
  ...(inReplyTo ? ['--in-reply-to', inReplyTo] : []),
];

runMailCli(normalizedArgs).catch((error) => {
  console.error('❌ Failed to send email:', error instanceof Error ? error.message : error);
  process.exit(1);
});
