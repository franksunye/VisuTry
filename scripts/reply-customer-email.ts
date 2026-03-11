import nodemailer from 'nodemailer';

async function main() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sun@visutry.com',
      pass: 'M6tfAdsx6P2yhxEi',
    },
  });

  const mailOptions = {
    from: '"Frank Sun | VisuTry AI Labs" <sun@visutry.com>',
    to: 'mohammed.alg.991@gmail.com',
    subject: 'Re: Reseller Inquiry for Libya & MENA - VisuTry AI Labs',
    text: `Hi Mohammed,

Thanks for reaching out! I'm Frank, co-founder of VisuTry AI Labs. It's great to connect.

We've been seeing a lot of excitement around AI virtual try-on from the MENA region, and we are definitely open to exploring a partnership with you. 

Before we jump into pricing plans and white-label setups, I'd love to learn a bit more about your business to make sure we suggest the right model:

1. Your current setup: Are you running optical stores directly, or are you a software provider for other clinics?
2. Scale: Roughly how many stores or websites are you planning to cover in the first few months?
3. Company Info: Just for our standard international onboarding checks, could you share your registered company name?

Also, have you had a chance to create an account on our website to test the try-on engine yourself? 

Looking forward to hearing from you!

Best,

Frank Sun
Co-founder | VisuTry AI Labs
visutry.com`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

main();
