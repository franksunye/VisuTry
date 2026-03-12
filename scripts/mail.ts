import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true, quiet: true });

type Command = 'list' | 'thread' | 'send' | 'reply';

type MessageSummary = {
  uid: number;
  date: string | null;
  from: string | null;
  subject: string | null;
  messageId: string | null;
  seen: boolean;
};

type ThreadMessage = MessageSummary & {
  text: string;
};

function printUsage(): never {
  console.error(`Usage:
  npx tsx scripts/mail.ts list [--limit 20] [--unread] [--from email] [--subject keyword] [--json]
  npx tsx scripts/mail.ts thread [--from email] [--message-id id] [--subject keyword] [--limit 20] [--json]
  npx tsx scripts/mail.ts send --from-email sun@visutry.com --to user@example.com --subject "..." (--body "..." | --body-file path) [--in-reply-to id] [--dry-run] [--json]
  npx tsx scripts/mail.ts reply --message-id id [--from-email sun@visutry.com] (--body "..." | --body-file path) [--quote] [--dry-run] [--json]`);
  process.exit(1);
}

function parseArgs(argv: string[]): { command: Command; options: Record<string, string | boolean> } {
  const [command, ...rest] = argv;
  if (command !== 'list' && command !== 'thread' && command !== 'send' && command !== 'reply') {
    printUsage();
  }

  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      printUsage();
    }

    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    i += 1;
  }

  return { command, options };
}

function getOption(options: Record<string, string | boolean>, key: string): string | undefined {
  const value = options[key];
  return typeof value === 'string' ? value : undefined;
}

function hasFlag(options: Record<string, string | boolean>, key: string): boolean {
  return options[key] === true;
}

function requireString(options: Record<string, string | boolean>, key: string): string {
  const value = getOption(options, key);
  if (!value) {
    console.error(`Missing required option --${key}`);
    printUsage();
  }
  return value;
}

function getBody(options: Record<string, string | boolean>): string {
  const inline = getOption(options, 'body');
  const bodyFile = getOption(options, 'body-file');

  if (inline && bodyFile) {
    throw new Error('Use either --body or --body-file, not both.');
  }

  if (bodyFile) {
    return fs.readFileSync(path.resolve(process.cwd(), bodyFile), 'utf8');
  }

  if (inline) {
    return inline;
  }

  throw new Error('Missing email body. Use --body or --body-file.');
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPasswordForSender(fromEmail: string): string {
  const envPrefix = fromEmail.split('@')[0].toUpperCase();
  return process.env[`${envPrefix}_PASS`] || getEnv('EXMAIL_PASS');
}

function getMessageSourceOrThrow(message: { uid: number; source?: Buffer<ArrayBufferLike> }): Buffer<ArrayBufferLike> {
  if (!message.source) {
    throw new Error(`IMAP message ${message.uid} is missing source content`);
  }

  return message.source;
}

export function getDisplayName(fromEmail: string): string {
  return fromEmail.startsWith('sun@')
    ? 'Frank Sun | VisuTry AI Labs'
    : 'VisuTry AI Labs Support';
}

function createImapClient(): ImapFlow {
  return new ImapFlow({
    host: 'imap.exmail.qq.com',
    port: 993,
    secure: true,
    auth: {
      user: getEnv('EXMAIL_USER'),
      pass: getEnv('EXMAIL_PASS'),
    },
    logger: false,
  });
}

export function createSmtpTransport(fromEmail: string) {
  return nodemailer.createTransport({
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: fromEmail,
      pass: getPasswordForSender(fromEmail),
    },
  });
}

export type SendMailParams = {
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string | string[];
};

export async function sendMail(params: SendMailParams): Promise<SMTPTransport.SentMessageInfo> {
  const transporter = createSmtpTransport(params.fromEmail);
  const mailOptions: Record<string, unknown> = {
    from: `"${getDisplayName(params.fromEmail)}" <${params.fromEmail}>`,
    to: params.to,
    subject: params.subject,
    text: params.text,
  };

  if (params.html) {
    mailOptions.html = params.html;
  }
  if (params.inReplyTo) {
    mailOptions.inReplyTo = params.inReplyTo;
  }
  if (params.references) {
    mailOptions.references = Array.isArray(params.references) ? params.references : [params.references];
  }

  return transporter.sendMail(mailOptions);
}

function toSummary(message: any): MessageSummary {
  const envelope = message.envelope;
  return {
    uid: message.uid,
    date: envelope?.date ? new Date(envelope.date).toISOString() : null,
    from: envelope?.from?.[0]?.address || null,
    subject: envelope?.subject || null,
    messageId: envelope?.messageId || null,
    seen: Boolean(message.flags?.has?.('\\Seen') || message.flags?.includes?.('\\Seen')),
  };
}

async function fetchMailboxMessages(): Promise<any[]> {
  const client = createImapClient();
  const messages: any[] = [];

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  try {
    for await (const message of client.fetch('1:*', {
      uid: true,
      envelope: true,
      flags: true,
    })) {
      messages.push(message);
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return messages;
}

function filterMessages(messages: MessageSummary[], options: Record<string, string | boolean>): MessageSummary[] {
  const from = getOption(options, 'from')?.toLowerCase();
  const subject = getOption(options, 'subject')?.toLowerCase();
  const unread = hasFlag(options, 'unread');

  return messages.filter((message) => {
    if (unread && message.seen) {
      return false;
    }
    if (from && !message.from?.toLowerCase().includes(from)) {
      return false;
    }
    if (subject && !message.subject?.toLowerCase().includes(subject)) {
      return false;
    }
    return true;
  });
}

function outputList(messages: MessageSummary[], asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(messages, null, 2));
    return;
  }

  messages.forEach((message, index) => {
    console.log(
      `[${index + 1}] ${message.date || 'no-date'} | ${message.from || 'unknown'} | ${message.subject || '(no subject)'} | uid=${message.uid} | seen=${message.seen ? 'yes' : 'no'} | messageId=${message.messageId || 'n/a'}`,
    );
  });
}

async function handleList(options: Record<string, string | boolean>): Promise<void> {
  const limit = Number(getOption(options, 'limit') || '20');
  const messages = (await fetchMailboxMessages())
    .map(toSummary)
    .sort((a, b) => b.uid - a.uid);

  const filtered = filterMessages(messages, options).slice(0, limit);
  outputList(filtered, hasFlag(options, 'json'));
}

async function handleThread(options: Record<string, string | boolean>): Promise<void> {
  const limit = Number(getOption(options, 'limit') || '20');
  const from = getOption(options, 'from')?.toLowerCase();
  const messageId = getOption(options, 'message-id');
  const subject = getOption(options, 'subject')?.toLowerCase();

  if (!from && !messageId && !subject) {
    throw new Error('thread requires one of --from, --message-id, or --subject');
  }

  const client = createImapClient();
  const threadMessages: ThreadMessage[] = [];

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  try {
    const candidates: any[] = [];
    for await (const message of client.fetch('1:*', {
      uid: true,
      envelope: true,
      flags: true,
      source: true,
    })) {
      const summary = toSummary(message);
      const fromMatch = !from || summary.from?.toLowerCase().includes(from);
      const subjectMatch = !subject || summary.subject?.toLowerCase().includes(subject);
      const idMatch = !messageId || summary.messageId === messageId;

      if (fromMatch && subjectMatch && idMatch) {
        candidates.push(message);
      }
    }

    for (const message of candidates.sort((a, b) => a.uid - b.uid).slice(-limit)) {
      const parsed = await simpleParser(getMessageSourceOrThrow(message));
      threadMessages.push({
        ...toSummary(message),
        text: parsed.text?.trim() || '',
      });
    }
  } finally {
    lock.release();
    await client.logout();
  }

  if (hasFlag(options, 'json')) {
    console.log(JSON.stringify(threadMessages, null, 2));
    return;
  }

  threadMessages.forEach((message) => {
    console.log(`--- DATE: ${message.date || 'no-date'} ---`);
    console.log(`--- SUBJECT: ${message.subject || '(no subject)'} ---`);
    console.log(`--- FROM: ${message.from || 'unknown'} ---`);
    console.log(`--- MESSAGE-ID: ${message.messageId || 'n/a'} ---`);
    console.log('--- BODY ---');
    console.log(message.text);
    console.log(`\n${'='.repeat(50)}\n`);
  });
}

async function handleSend(options: Record<string, string | boolean>): Promise<void> {
  const fromEmail = requireString(options, 'from-email');
  const to = requireString(options, 'to');
  const subject = requireString(options, 'subject');
  const body = getBody(options);
  const inReplyTo = getOption(options, 'in-reply-to');
  const references = getOption(options, 'references') || inReplyTo;
  const dryRun = hasFlag(options, 'dry-run');
  const asJson = hasFlag(options, 'json');

  const mailOptions: Record<string, unknown> = {
    from: `"${getDisplayName(fromEmail)}" <${fromEmail}>`,
    to,
    subject,
    text: body,
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(references ? { references: [references] } : {}),
  };

  if (dryRun) {
    if (asJson) {
      console.log(JSON.stringify({ dryRun: true, mailOptions }, null, 2));
    } else {
      console.log('DRY RUN');
      console.log(JSON.stringify(mailOptions, null, 2));
    }
    return;
  }

  const info = await sendMail({
    fromEmail,
    to,
    subject,
    text: body,
    ...(inReplyTo ? { inReplyTo } : {}),
    ...(references ? { references } : {}),
  });

  if (asJson) {
    console.log(JSON.stringify({ ok: true, messageId: info.messageId }, null, 2));
    return;
  }

  console.log(`✅ Email sent successfully from ${fromEmail}!`);
  console.log(`Message ID: ${info.messageId}`);
}

async function findMessageById(messageId: string): Promise<MessageSummary | null> {
  const messages = await fetchMailboxMessages();
  const found = messages.find((message) => toSummary(message).messageId === messageId);
  return found ? toSummary(found) : null;
}

async function fetchMessageDetailsById(messageId: string): Promise<ThreadMessage | null> {
  const client = createImapClient();

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');

  try {
    for await (const message of client.fetch('1:*', {
      uid: true,
      envelope: true,
      flags: true,
      source: true,
    })) {
      const summary = toSummary(message);
      if (summary.messageId !== messageId) {
        continue;
      }

      const parsed = await simpleParser(getMessageSourceOrThrow(message));
      return {
        ...summary,
        text: parsed.text?.trim() || '',
      };
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return null;
}

function normalizeReplySubject(subject: string | null): string {
  if (!subject) {
    return 'Re:';
  }
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function formatQuotedReplyHeader(original: ThreadMessage): string {
  const date = original.date
    ? new Date(original.date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'an earlier message';

  return `On ${date}, ${original.from || 'unknown sender'} wrote:`;
}

function formatQuotedReplyBody(original: ThreadMessage): string {
  const quotedLines = (original.text || '')
    .split('\n')
    .map((line) => `> ${line}`);

  return [formatQuotedReplyHeader(original), ...quotedLines].join('\n');
}

async function handleReply(options: Record<string, string | boolean>): Promise<void> {
  const messageId = requireString(options, 'message-id');
  const baseBody = getBody(options);
  const includeQuote = hasFlag(options, 'quote');
  const fromEmail = getOption(options, 'from-email') || getEnv('EXMAIL_USER');
  const original = includeQuote
    ? await fetchMessageDetailsById(messageId)
    : await findMessageById(messageId);

  if (!original?.from) {
    throw new Error(`Original message not found for message-id: ${messageId}`);
  }

  const body = includeQuote && 'text' in original
    ? `${baseBody.trimEnd()}\n\n${formatQuotedReplyBody(original as ThreadMessage)}`
    : baseBody;

  const mergedOptions: Record<string, string | boolean> = {
    ...Object.fromEntries(
      Object.entries(options).filter(([key]) => !['body-file', 'message-id', 'quote'].includes(key)),
    ),
    'from-email': fromEmail,
    to: original.from,
    subject: normalizeReplySubject(original.subject),
    body,
    'in-reply-to': messageId,
    references: messageId,
  };

  await handleSend(mergedOptions);
}

export async function runMailCli(argv: string[]): Promise<void> {
  const { command, options } = parseArgs(argv);

  if (command === 'list') {
    await handleList(options);
    return;
  }

  if (command === 'thread') {
    await handleThread(options);
    return;
  }

  if (command === 'send') {
    await handleSend(options);
    return;
  }

  await handleReply(options);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryPath === fileURLToPath(import.meta.url)) {
  runMailCli(process.argv.slice(2)).catch((error) => {
    console.error('❌ Mail command failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
