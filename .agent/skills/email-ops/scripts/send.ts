import nodemailer from 'nodemailer';

async function sendEmail() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: npx tsx send.ts <from_email> <to_email> <subject> <body> [in_reply_to_message_id]');
    process.exit(1);
  }

  const [fromEmail, to, subject, body, inReplyTo] = args;

  // 动态获取对应邮箱的密码 (支持多邮箱扩展，例如 SUPPORT_PASS, SUN_PASS)
  // 默认如果没配置单独的，使用原来的 EXMAIL_PASS
  const envPrefix = fromEmail.split('@')[0].toUpperCase(); 
  const pass = process.env[`${envPrefix}_PASS`] || process.env.EXMAIL_PASS;

  if (!pass) {
    console.error(`Error: Password for ${fromEmail} not found in environment (tried ${envPrefix}_PASS and EXMAIL_PASS).`);
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    auth: { user: fromEmail, pass },
  });

  // 根据发件邮箱决定显示名称
  const senderName = fromEmail.startsWith('sun@') 
    ? 'Frank Sun | VisuTry AI Labs' 
    : 'VisuTry AI Labs Support';

  const mailOptions: any = {
    from: `"${senderName}" <${fromEmail}>`,
    to,
    subject,
    text: body,
  };

  if (inReplyTo) {
    mailOptions.inReplyTo = inReplyTo;
    mailOptions.references = [inReplyTo];
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully from ${fromEmail}!`);
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

sendEmail();
