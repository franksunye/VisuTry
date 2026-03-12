
/**
 * 🧹 Comprehensive Storage Cleanup Script (V2 - Perfected)
 * 
 * 此脚本根据用户当前的订阅状态，精准清理过期的 Try-on 任务及其关联的 Vercel Blob 文件。
 * 
 * 完善点：
 * 1. 自动识别降级用户（Premium -> Free）并修正其任务过期时间。
 * 2. 批量物理删除 Vercel Blob 存储中的图片。
 * 3. 批量删除数据库记录。
 * 4. 给受影响的用户发送删除通知邮件（基于 Resend）。
 * 5. 详细的 Dry Run 预览模式。
 * 
 * Usage:
 *   npx tsx scripts/comprehensive-cleanup.ts [--dry-run=false]
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables before anything else
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../src/lib/prisma';
import { del } from '@vercel/blob';
import { RETENTION_CONFIG } from '../src/config/retention';
import nodemailer from 'nodemailer';
import { getDeletionEmailContent } from '../src/templates/deletion-email';

const isDryRun = !process.argv.includes('--dry-run=false');

// Safety over-rides for conservative mode
const customFreeRetention = process.argv.find(a => a.startsWith('--free-days='))?.split('=')[1];
const maxLimitRaw = process.argv.find(a => a.startsWith('--limit='))?.split('=')[1];

const config = {
  FREE_DAYS: customFreeRetention ? parseInt(customFreeRetention) : RETENTION_CONFIG.FREE_USER,
  LIMIT: maxLimitRaw ? parseInt(maxLimitRaw) : undefined
};

async function main() {
  console.log('\n🚀 Starting Conservative Storage Cleanup');
  console.log(`📡 Mode: ${isDryRun ? '🔍 DRY RUN' : '🔥 LIVE'}`);
  console.log(`🛡️  Settings: Free Retention = ${config.FREE_DAYS} days, Limit = ${config.LIMIT || 'Unlimited'}`);
  console.log('--------------------------------------------------');

  const now = new Date();
  
  try {
    // 1. 获取所有任务及其关联用户信息
    console.log('Reading database tasks and user plans...');
    const allTasks = await prisma.tryOnTask.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isPremium: true,
            creditsPurchased: true,
            creditsUsed: true,
            lastRetentionDeletedEmailSent: true,
          }
        }
      }
    });

    console.log(`Total tasks to analyze: ${allTasks.length}`);

    const tasksToDelete: typeof allTasks = [];
    const tasksToFixExpiry: { taskId: string, newExpiry: Date }[] = [];
    const userNotificationMap = new Map<string, { email: string | null, name: string | null, expiryDate: Date }>();
    
    let stats = {
      freeExpired: 0,
      creditsExpired: 0,
      premiumExpired: 0,
      totalExpired: 0,
      blobsToCleanup: 0,
    };

    // 2. 核心逻辑：基于当前 Plan 状态重新评估过期时间
    for (const task of allTasks) {
      const { user } = task;
      
      // 根据用户【当前】身份确定保留天数
      let retentionDays: number = config.FREE_DAYS;
      let planType = 'FREE';

      if (user.isPremium) {
        retentionDays = RETENTION_CONFIG.PREMIUM_USER;
        planType = 'PREMIUM';
      } else if ((user.creditsPurchased - user.creditsUsed) > 0) {
        retentionDays = RETENTION_CONFIG.CREDITS_USER;
        planType = 'CREDITS';
      }

      // 计算合理的过期日期（相对于创建时间）
      const shouldExpireAt = new Date(task.createdAt);
      shouldExpireAt.setDate(shouldExpireAt.getDate() + retentionDays);

      const isExpired = shouldExpireAt <= now;

      if (isExpired) {
        // 标记为待删除
        tasksToDelete.push(task);
        stats.totalExpired++;
        if (planType === 'FREE') stats.freeExpired++;
        else if (planType === 'CREDITS') stats.creditsExpired++;
        else stats.premiumExpired++;
        
        // 统计 Blob 数量
        if (task.userImageUrl) stats.blobsToCleanup++;
        if (task.itemImageUrl) stats.blobsToCleanup++;
        if (task.glassesImageUrl) stats.blobsToCleanup++;
        if (task.resultImageUrl) stats.blobsToCleanup++;

        // 记录需要通知的用户
        if (user.email) {
          userNotificationMap.set(user.id, { 
            email: user.email, 
            name: user.name, 
            expiryDate: task.expiresAt || shouldExpireAt 
          });
        }
      } else {
        // 如果未到期，但数据库中的 expiresAt 与计算结果不符（比如降级了但还没过期）
        if (!task.expiresAt || Math.abs(task.expiresAt.getTime() - shouldExpireAt.getTime()) > 3600000) {
          tasksToFixExpiry.push({ taskId: task.id, newExpiry: shouldExpireAt });
        }
      }
    }

    // 3. 展示汇总报告并生成清单
    const reportPath = path.resolve(process.cwd(), 'scripts/cleanup-report.json');
    const userSummary = Array.from(userNotificationMap.entries()).map(([userId, info]) => ({
      userId,
      email: info.email,
      name: info.name,
      taskCount: tasksToDelete.filter(t => t.userId === userId).length,
      exampleExpiry: info.expiryDate
    }));

    console.log('\n📋 Analysis Complete - Summary of Findings:');
    console.log(`  - Total Tasks Analyzed: ${allTasks.length}`);
    console.log(`  - 🗑️  Expired Tasks to Delete: ${stats.totalExpired}`);
    console.log(`    - From Free Users (7 days):    ${stats.freeExpired}`);
    console.log(`    - From Credits Users (90 days): ${stats.creditsExpired}`);
    console.log(`    - From Premium Users (365 days): ${stats.premiumExpired}`);
    console.log(`  - 🖼️  Estimated Blobs to Delete: ~${stats.blobsToCleanup}`);
    console.log(`  - 🛠️  Outdated Metadata to Fix: ${tasksToFixExpiry.length} tasks`);
    console.log(`  - 📧 Users to be notified: ${userNotificationMap.size}`);
    
    // Save detailed list to file
    const fs = await import('fs');
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: now.toISOString(),
      stats,
      affectedUsers: userSummary,
      tasksToDelete: tasksToDelete.map(t => ({ id: t.id, userId: t.userId, createdAt: t.createdAt, expiresAt: t.expiresAt }))
    }, null, 2));

    console.log(`\n📄 Detailed cleanup list saved to: ${reportPath}`);
    console.log('--------------------------------------------------');

    if (stats.totalExpired === 0 && tasksToFixExpiry.length === 0) {
      console.log('✅ Status Perfect. No cleanup needed.');
      return;
    }

    if (isDryRun) {
      console.log('\n💡 DRY RUN NOTICE:');
      console.log('   The data above shows what WOULDS be deleted/updated.');
      console.log('   To apply these changes, run with the --dry-run=false flag:');
      console.log('   npx tsx scripts/comprehensive-cleanup.ts --dry-run=false');
      return;
    }

    // 4. 执行物理清理过程
    
    // 4.1 纠正未过期的任务元数据
    if (tasksToFixExpiry.length > 0) {
      console.log(`\nStep 1/3: Updating ${tasksToFixExpiry.length} task expiries...`);
      for (const item of tasksToFixExpiry) {
        await prisma.tryOnTask.update({
          where: { id: item.taskId },
          data: { expiresAt: item.newExpiry }
        });
      }
      console.log('✅ Metadata updated.');
    }

    // 4.2 物理删除 Blob 文件和 DB 记录
    if (tasksToDelete.length > 0) {
      // Apply safety limit if specified
      let finalTasksToDelete = tasksToDelete;
      if (config.LIMIT && tasksToDelete.length > config.LIMIT) {
        console.log(`⚠️  Limit reached: Only processing the oldest ${config.LIMIT} tasks out of ${tasksToDelete.length}`);
        // Sort by createdAt to ensure we delete oldest first
        finalTasksToDelete = tasksToDelete
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, config.LIMIT);
      }

      console.log(`\nStep 2/3: Deleting ${finalTasksToDelete.length} tasks and files...`);
      
      const batchSize = 25;
      for (let i = 0; i < finalTasksToDelete.length; i += batchSize) {
        const batch = finalTasksToDelete.slice(i, i + batchSize);
        const blobUrls: string[] = [];
        const taskIds: string[] = [];

        batch.forEach(task => {
          taskIds.push(task.id);
          if (task.userImageUrl) blobUrls.push(task.userImageUrl);
          if (task.itemImageUrl) blobUrls.push(task.itemImageUrl);
          if (task.glassesImageUrl) blobUrls.push(task.glassesImageUrl);
          if (task.resultImageUrl) blobUrls.push(task.resultImageUrl);
        });

        // 删除 Vercel Blob
        if (blobUrls.length > 0) {
          try {
            await del(blobUrls);
          } catch (err) {
            console.error(`  ⚠️ Blob deletion skip/error: ${err}`);
          }
        }

        // 删除 Prisma 记录
        await prisma.tryOnTask.deleteMany({
          where: { id: { in: taskIds } }
        });
        
        process.stdout.write(`  Progress: ${Math.min(i + batchSize, tasksToDelete.length)}/${tasksToDelete.length}\r`);
      }
      console.log('\n✅ File and DB cleanup finished.');
    }

    // 4.3 发送通知邮件
    if (userNotificationMap.size > 0) {
      console.log(`\nStep 3/3: Sending deletion notifications to ${userNotificationMap.size} users via Exmail...`);
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.exmail.qq.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EXMAIL_USER,
          pass: process.env.EXMAIL_PASS,
        },
      });

      let sentCount = 0;
      const notificationList = Array.from(userNotificationMap.entries());
      for (const [userId, info] of notificationList) {
        if (!info.email) continue;
        
        const emailContent = getDeletionEmailContent(info.name || '', info.expiryDate.toLocaleDateString());
        
        try {
          await transporter.sendMail({
            from: '"VisuTry Support" <support@visutry.com>',
            to: info.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });

          await prisma.user.update({
            where: { id: userId },
            data: { lastRetentionDeletedEmailSent: now },
          });
          sentCount++;
          process.stdout.write(`  Mails: ${sentCount}/${userNotificationMap.size}\r`);
        } catch (err) {
          console.error(`\n  ❌ Failed to send to ${info.email}:`, err);
        }
        
        // Avoiding rate limits/spam filters
        await new Promise(r => setTimeout(r, 1000));
      }
      console.log(`\n✅ Sent ${sentCount} notifications.`);
    }

    console.log('\n🎊 MISSION ACCOMPLISHED: Storage is now clean and synchronized with plans.');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR during execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
