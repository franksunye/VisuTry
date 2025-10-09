#!/usr/bin/env node

/**
 * Verify Prisma Configuration for Vercel Deployment
 * 
 * This script checks if Prisma is correctly configured for Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Prisma Configuration Verification for Vercel\n');
console.log('='.repeat(80));

let hasErrors = false;
let hasWarnings = false;

// Check 1: vercel.json
console.log('\n📋 CHECK 1: vercel.json Configuration');
console.log('-'.repeat(80));

const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  // Check for PRISMA_GENERATE_DATAPROXY
  const hasDataProxyInEnv = vercelJson.env && vercelJson.env.PRISMA_GENERATE_DATAPROXY;
  const hasDataProxyInBuild = vercelJson.build && vercelJson.build.env && vercelJson.build.env.PRISMA_GENERATE_DATAPROXY;
  
  if (hasDataProxyInEnv || hasDataProxyInBuild) {
    console.log('  ❌ CRITICAL: PRISMA_GENERATE_DATAPROXY is set in vercel.json');
    console.log('     This will cause P6001 error unless you use prisma:// URL');
    console.log('     SOLUTION: Remove this from vercel.json');
    hasErrors = true;
  } else {
    console.log('  ✅ PRISMA_GENERATE_DATAPROXY is not set (correct)');
  }
  
  // Check function timeout
  if (vercelJson.functions && vercelJson.functions['src/app/api/**/*.ts']) {
    const timeout = vercelJson.functions['src/app/api/**/*.ts'].maxDuration;
    console.log(`  ✅ API function timeout: ${timeout}s`);
    if (timeout < 10) {
      console.log('     ⚠️  Warning: Timeout might be too short for OAuth');
      hasWarnings = true;
    }
  }
} else {
  console.log('  ⚠️  vercel.json not found');
  hasWarnings = true;
}

// Check 2: NextAuth API Route
console.log('\n📋 CHECK 2: NextAuth API Route Configuration');
console.log('-'.repeat(80));

const nextAuthRoutePath = path.join(process.cwd(), 'src/app/api/auth/[...nextauth]/route.ts');
if (fs.existsSync(nextAuthRoutePath)) {
  const content = fs.readFileSync(nextAuthRoutePath, 'utf8');
  
  // Check for runtime export
  if (content.includes("export const runtime = 'nodejs'")) {
    console.log("  ✅ Runtime explicitly set to 'nodejs'");
  } else if (content.includes("export const runtime = 'edge'")) {
    console.log("  ❌ CRITICAL: Runtime set to 'edge'");
    console.log('     Edge runtime requires special Prisma configuration');
    console.log("     SOLUTION: Change to runtime = 'nodejs'");
    hasErrors = true;
  } else {
    console.log("  ⚠️  Runtime not explicitly set");
    console.log('     Vercel will use default (usually nodejs, but not guaranteed)');
    console.log("     RECOMMENDATION: Add: export const runtime = 'nodejs'");
    hasWarnings = true;
  }
  
  // Check for dynamic export
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log("  ✅ Dynamic rendering enabled");
  } else {
    console.log("  ⚠️  Dynamic rendering not explicitly set");
    hasWarnings = true;
  }
} else {
  console.log('  ❌ NextAuth route file not found');
  hasErrors = true;
}

// Check 3: DATABASE_URL Format
console.log('\n📋 CHECK 3: DATABASE_URL Format');
console.log('-'.repeat(80));

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    console.log('  ✅ DATABASE_URL uses PostgreSQL protocol (correct for Node.js runtime)');
    console.log(`     ${databaseUrl.substring(0, 30)}...`);
  } else if (databaseUrl.startsWith('prisma://')) {
    console.log('  ⚠️  DATABASE_URL uses Prisma Data Proxy protocol');
    console.log('     This requires PRISMA_GENERATE_DATAPROXY=true');
    console.log('     Make sure this is intentional');
    hasWarnings = true;
  } else {
    console.log('  ❌ DATABASE_URL has unexpected protocol');
    console.log(`     ${databaseUrl.substring(0, 30)}...`);
    hasErrors = true;
  }
} else {
  console.log('  ⚠️  DATABASE_URL not set in current environment');
  console.log('     Make sure it is set in Vercel environment variables');
  hasWarnings = true;
}

// Check 4: Prisma Schema
console.log('\n📋 CHECK 4: Prisma Schema');
console.log('-'.repeat(80));

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Check generator
  if (schema.includes('generator client')) {
    console.log('  ✅ Prisma client generator configured');
    
    // Check for driverAdapters preview feature
    if (schema.includes('previewFeatures') && schema.includes('driverAdapters')) {
      console.log('  ℹ️  Driver adapters enabled (for Edge Runtime support)');
    }
  }
  
  // Check datasource
  if (schema.includes('provider = "postgresql"')) {
    console.log('  ✅ PostgreSQL provider configured');
  }
} else {
  console.log('  ❌ Prisma schema not found');
  hasErrors = true;
}

// Check 5: Proxy Setup
console.log('\n📋 CHECK 5: Proxy Setup (Should NOT affect Vercel)');
console.log('-'.repeat(80));

const proxySetupPath = path.join(process.cwd(), 'src/lib/proxy-setup.ts');
if (fs.existsSync(proxySetupPath)) {
  const content = fs.readFileSync(proxySetupPath, 'utf8');
  
  // Check for Vercel detection
  if (content.includes('process.env.VERCEL') || content.includes('VERCEL_URL')) {
    console.log('  ✅ Proxy setup detects Vercel environment');
  } else {
    console.log('  ⚠️  Proxy setup may not properly detect Vercel');
    console.log('     Could interfere with production OAuth');
    hasWarnings = true;
  }
  
  // Check for multiple environment checks
  if (content.includes('isLocalDev') && content.includes('!isVercel')) {
    console.log('  ✅ Proxy only enabled in local development');
  }
} else {
  console.log('  ℹ️  No proxy setup file (not required for Vercel)');
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(80));

if (hasErrors) {
  console.log('\n❌ CRITICAL ISSUES FOUND - Must fix before deploying to Vercel');
  console.log('\nRecommended actions:');
  console.log('  1. Remove PRISMA_GENERATE_DATAPROXY from vercel.json');
  console.log("  2. Add 'export const runtime = \"nodejs\"' to NextAuth route");
  console.log('  3. Ensure DATABASE_URL uses postgresql:// protocol');
  console.log('  4. Commit and push changes to trigger new deployment');
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS FOUND - Recommended to fix');
  console.log('\nThe app may work, but these improvements are recommended:');
  console.log("  1. Explicitly set runtime = 'nodejs' in NextAuth route");
  console.log("  2. Add dynamic = 'force-dynamic' for better reliability");
  console.log('  3. Verify DATABASE_URL is set in Vercel environment variables');
} else {
  console.log('\n✅ ALL CHECKS PASSED');
  console.log('\nYour Prisma configuration looks good for Vercel deployment!');
  console.log('\nNext steps:');
  console.log('  1. Commit and push your changes');
  console.log('  2. Wait for Vercel deployment to complete');
  console.log('  3. Test Twitter OAuth on production');
}

console.log('\n' + '='.repeat(80));
console.log('For detailed fix instructions, see: docs/VERCEL-OAUTH-FIX.md');
console.log('='.repeat(80) + '\n');

process.exit(hasErrors ? 1 : 0);

