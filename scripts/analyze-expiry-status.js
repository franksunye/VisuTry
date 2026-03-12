
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const now = new Date();
    
    // Query users and tasks
    const tasksRes = await client.query(`
      SELECT t.id, t."expiresAt", t."createdAt", u."isPremium", u."creditsPurchased", u."creditsUsed"
      FROM "TryOnTask" t
      JOIN "User" u ON t."userId" = u.id
    `);

    const tasks = tasksRes.rows;
    console.log(`Total Tasks: ${tasks.length}`);

    let expiredInDb = 0;
    let shouldBeExpired = 0;
    
    const RETENTION = {
      FREE: 7,
      CREDITS: 90,
      PREMIUM: 365
    };

    for (const task of tasks) {
      if (task.expiresAt && new Date(task.expiresAt) <= now) {
        expiredInDb++;
      }

      let retentionDays = RETENTION.FREE;
      if (task.isPremium) {
        retentionDays = RETENTION.PREMIUM;
      } else if ((task.creditsPurchased - task.creditsUsed) > 0) {
        retentionDays = RETENTION.CREDITS;
      }

      const shouldExpireAt = new Date(task.createdAt);
      shouldExpireAt.setDate(shouldExpireAt.getDate() + retentionDays);

      if (shouldExpireAt <= now) {
        shouldBeExpired++;
      }
    }

    console.log('\n=== Storage Analysis ===');
    console.log(`Current Time (UTC): ${now.toISOString()}`);
    console.log(`Total Tasks: ${tasks.length}`);
    console.log(`Tasks marked as Expired in DB: ${expiredInDb}`);
    console.log(`Tasks that SHOULD be expired (current rules): ${shouldBeExpired}`);
    console.log(`Potential cleanup Gain: ${Math.max(0, shouldBeExpired - expiredInDb)} tasks`);

  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await client.end();
  }
}

main();
