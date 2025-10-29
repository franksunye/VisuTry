#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * This script helps test and monitor Core Web Vitals and performance metrics.
 * It provides instructions and links for various performance testing tools.
 */

const chalk = require('chalk') || { 
  green: (s) => s, 
  blue: (s) => s, 
  yellow: (s) => s, 
  red: (s) => s,
  bold: (s) => s 
}

console.log('\n' + '='.repeat(60))
console.log('🚀 VisuTry Performance Testing Guide')
console.log('='.repeat(60) + '\n')

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'

console.log(`📍 Testing URL: ${chalk.blue(siteUrl)}\n`)

// 1. PageSpeed Insights
console.log(chalk.bold('1. PageSpeed Insights (Google)'))
console.log('   Best for: Core Web Vitals, Mobile/Desktop scores')
console.log(`   URL: ${chalk.blue('https://pagespeed.web.dev/')}`)
console.log(`   Test: ${chalk.blue(siteUrl + '/blog')}`)
console.log('   Expected Scores:')
console.log('   - Performance: 90-100')
console.log('   - Accessibility: 95-100')
console.log('   - Best Practices: 90-100')
console.log('   - SEO: 95-100\n')

// 2. Lighthouse
console.log(chalk.bold('2. Lighthouse (Chrome DevTools)'))
console.log('   Best for: Detailed performance analysis')
console.log('   Steps:')
console.log('   1. Open Chrome DevTools (F12)')
console.log('   2. Go to Lighthouse tab')
console.log('   3. Select "Performance" category')
console.log('   4. Click "Analyze page load"\n')

// 3. WebPageTest
console.log(chalk.bold('3. WebPageTest'))
console.log('   Best for: Detailed waterfall analysis')
console.log(`   URL: ${chalk.blue('https://www.webpagetest.org/')}`)
console.log(`   Test: ${chalk.blue(siteUrl + '/blog')}`)
console.log('   Settings:')
console.log('   - Location: Dulles, VA (or closest to target audience)')
console.log('   - Browser: Chrome')
console.log('   - Connection: Cable\n')

// 4. GTmetrix
console.log(chalk.bold('4. GTmetrix'))
console.log('   Best for: Performance monitoring over time')
console.log(`   URL: ${chalk.blue('https://gtmetrix.com/')}`)
console.log(`   Test: ${chalk.blue(siteUrl + '/blog')}\n`)

// 5. Bundle Analyzer
console.log(chalk.bold('5. Bundle Analyzer (Local)'))
console.log('   Best for: Analyzing JavaScript bundle size')
console.log('   Command:')
console.log(chalk.yellow('   npm run analyze'))
console.log('   This will:')
console.log('   - Build the production bundle')
console.log('   - Open interactive bundle visualization')
console.log('   - Show size of each module\n')

// 6. Core Web Vitals Targets
console.log(chalk.bold('6. Core Web Vitals Targets'))
console.log('   ✅ LCP (Largest Contentful Paint): < 2.5s')
console.log('   ✅ FID (First Input Delay): < 100ms')
console.log('   ✅ CLS (Cumulative Layout Shift): < 0.1\n')

// 7. Testing Checklist
console.log(chalk.bold('7. Testing Checklist'))
console.log('   [ ] Run PageSpeed Insights for homepage')
console.log('   [ ] Run PageSpeed Insights for /blog')
console.log('   [ ] Run PageSpeed Insights for a blog post')
console.log('   [ ] Test on mobile device')
console.log('   [ ] Test on desktop')
console.log('   [ ] Check bundle size with analyzer')
console.log('   [ ] Verify lazy loading in Network tab')
console.log('   [ ] Check image optimization')
console.log('   [ ] Verify no console errors\n')

// 8. Quick Test Commands
console.log(chalk.bold('8. Quick Test Commands'))
console.log(chalk.yellow('   # Build and analyze bundle'))
console.log('   npm run analyze\n')
console.log(chalk.yellow('   # Build production'))
console.log('   npm run build\n')
console.log(chalk.yellow('   # Start production server'))
console.log('   npm run start\n')

// 9. Monitoring
console.log(chalk.bold('9. Continuous Monitoring'))
console.log('   - Google Search Console: Core Web Vitals report')
console.log('   - Google Analytics 4: Web Vitals events')
console.log('   - Vercel Analytics: Real-time performance (optional)\n')

// 10. Performance Report
console.log(chalk.bold('10. Documentation'))
console.log(`   Full report: ${chalk.blue('docs/performance-optimization-report.md')}`)
console.log(`   SEO backlog: ${chalk.blue('docs/project/seo-backlog.md')}\n`)

console.log('='.repeat(60))
console.log('💡 Tip: Test multiple pages and devices for comprehensive results')
console.log('='.repeat(60) + '\n')

// Check if we should open PageSpeed Insights
const args = process.argv.slice(2)
if (args.includes('--open') || args.includes('-o')) {
  const { exec } = require('child_process')
  const url = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(siteUrl + '/blog')}`
  
  console.log(chalk.green('Opening PageSpeed Insights...\n'))
  
  // Try to open in default browser
  const command = process.platform === 'win32' ? 'start' : 
                  process.platform === 'darwin' ? 'open' : 'xdg-open'
  
  exec(`${command} "${url}"`, (error) => {
    if (error) {
      console.log(chalk.yellow('Could not open browser automatically.'))
      console.log(`Please visit: ${chalk.blue(url)}\n`)
    }
  })
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(chalk.bold('Usage:'))
  console.log('  node scripts/test-performance.js [options]\n')
  console.log(chalk.bold('Options:'))
  console.log('  -o, --open    Open PageSpeed Insights in browser')
  console.log('  -h, --help    Show this help message\n')
}

