
/**
 * 🧹 Storage Cleanup Notification Template (Standard)
 */

export const getDeletionEmailContent = (name: string, expiryDate: string) => {
  const firstName = name || 'there';
  
  return {
    subject: 'Important notice regarding your VisuTry trial data',
    text: `Hi ${firstName},

We are writing to inform you that, in accordance with our data retention policy, your historical try-on data from ${expiryDate} has been cleared from our storage systems.

What does this mean?
- Your try-on images (input and results) have been permanently deleted to optimize system performance.
- Your VisuTry account, any purchased Credits, and subscription status remain completely unaffected.

Why was this done?
In order to provide the fastest experience for all our users, we periodically clear trial data for inactive periods (7-30 days for free trials).

If you wish to create new try-ons, feel free to visit us again at https://visutry.com.

Best regards,
The VisuTry Team
support@visutry.com`,
    
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #000; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">VisuTry AI Labs</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111;">Data Retention Notice</h2>
          <p>Hi <strong>${firstName}</strong>,</p>
          <p>We are writing to inform you that, in accordance with our data retention policy, your historical try-on data from <strong>${expiryDate}</strong> has been cleared from our storage systems.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 16px;">What does this mean?</h3>
            <ul style="padding-left: 20px;">
              <li>Your try-on images (input and results) have been permanently deleted.</li>
              <li>Your <strong>VisuTry account</strong> and <strong>Credits/Subscription</strong> remain completely unaffected.</li>
            </ul>
          </div>
          
          <p>This is part of our commitment to maintaining a fast and secure experience for all users.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://visutry.com" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit VisuTry Again</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">
            You received this email because of your VisuTry account data retention policy.<br/>
            &copy; 2026 VisuTry AI Labs. All rights reserved.
          </p>
        </div>
      </div>
    `
  };
};
