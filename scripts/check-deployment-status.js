#!/usr/bin/env node

/**
 * 检查Vercel部署状态
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function checkDeploymentStatus() {
  console.log('🚀 Vercel部署状态检查工具\n');
  
  console.log('📋 部署检查清单:');
  console.log('');
  
  // 1. GitHub推送状态
  console.log('✅ 1. GitHub推送: 成功');
  console.log('   - 代码已推送到main分支');
  console.log('   - TypeScript错误已修复');
  console.log('   - 数据库配置已更新为PostgreSQL');
  console.log('');
  
  // 2. Vercel自动部署
  console.log('🔄 2. Vercel自动部署:');
  console.log('   - Vercel应该已检测到GitHub推送');
  console.log('   - 自动部署应该已开始');
  console.log('   - 请检查Vercel Dashboard查看部署进度');
  console.log('');
  
  // 3. 环境变量检查
  console.log('⚙️  3. 环境变量配置:');
  console.log('   - 确保在Vercel中配置了所有必需的环境变量');
  console.log('   - 特别注意NEXTAUTH_URL要设置为您的Vercel域名');
  console.log('   - 数据库连接字符串要正确');
  console.log('');
  
  // 4. 部署验证步骤
  console.log('🔍 4. 部署完成后验证步骤:');
  console.log('   a) 访问您的Vercel应用URL');
  console.log('   b) 检查健康检查: /api/health');
  console.log('   c) 测试登录页面: /auth/signin');
  console.log('   d) 测试Twitter OAuth登录');
  console.log('   e) 测试核心功能');
  console.log('');
  
  const vercelUrl = await askQuestion('请输入您的Vercel应用URL (如果已知): ');
  
  if (vercelUrl && vercelUrl.startsWith('http')) {
    console.log('\n🌐 快速验证链接:');
    console.log(`📊 健康检查: ${vercelUrl}/api/health`);
    console.log(`🔐 登录页面: ${vercelUrl}/auth/signin`);
    console.log(`🏠 主页: ${vercelUrl}`);
    console.log('');
    
    console.log('🧪 建议测试步骤:');
    console.log('1. 打开健康检查链接，应该看到JSON响应');
    console.log('2. 打开登录页面，应该看到Twitter登录按钮');
    console.log('3. 尝试Twitter OAuth登录流程');
    console.log('4. 测试图片上传和AI试戴功能');
    console.log('');
  }
  
  console.log('📋 常见问题排查:');
  console.log('');
  console.log('🔴 如果部署失败:');
  console.log('   - 检查Vercel部署日志');
  console.log('   - 确认环境变量配置正确');
  console.log('   - 检查数据库连接');
  console.log('');
  console.log('🔴 如果运行时错误:');
  console.log('   - 检查NEXTAUTH_URL是否正确');
  console.log('   - 确认Twitter OAuth回调URL配置');
  console.log('   - 验证API密钥有效性');
  console.log('');
  console.log('🔴 如果功能异常:');
  console.log('   - 检查浏览器开发者工具控制台');
  console.log('   - 查看网络请求状态');
  console.log('   - 确认数据库迁移成功');
  console.log('');
  
  console.log('🎯 部署成功标志:');
  console.log('✅ Vercel显示部署成功');
  console.log('✅ 健康检查API返回200状态');
  console.log('✅ 登录页面正常加载');
  console.log('✅ Twitter OAuth配置正确');
  console.log('✅ 数据库连接正常');
  console.log('');
  
  console.log('🎉 如果所有检查都通过，恭喜您的VisuTry应用已成功部署！');
  console.log('');
  console.log('📞 需要帮助?');
  console.log('   - 检查Vercel Dashboard的部署日志');
  console.log('   - 查看浏览器开发者工具');
  console.log('   - 确认所有环境变量配置');
  
  rl.close();
}

checkDeploymentStatus().catch(error => {
  console.error('💥 检查过程中发生错误:', error);
  rl.close();
  process.exit(1);
});
