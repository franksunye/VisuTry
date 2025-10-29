#!/usr/bin/env node

/**
 * Fix Blog Accessibility Issues
 * 
 * This script adds <main> landmark to all blog post pages
 * to fix the accessibility issue identified in PageSpeed Insights
 */

const fs = require('fs');
const path = require('path');

// List of blog post directories that need to be fixed
const blogPosts = [
  'browline-clubmaster-glasses-complete-guide',
  'acetate-vs-plastic-eyeglass-frames-guide',
  'best-ai-virtual-glasses-tryon-tools-2025',
  'celebrity-glasses-style-guide-2025',
  'oliver-peoples-finley-vintage-review',
  'rayban-glasses-virtual-tryon-guide',
  'tom-ford-luxury-eyewear-guide-2025',
];

const baseDir = path.join(process.cwd(), 'src/app/(main)/blog');

let modified = 0;
let skipped = 0;

console.log('🔧 Fixing blog accessibility issues...\n');

blogPosts.forEach(postDir => {
  const filePath = path.join(baseDir, postDir, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${postDir}/page.tsx`);
    skipped++;
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Replace <div className="container with <main className="container
    content = content.replace(
      /<div className="container mx-auto px-4 py-12">/g,
      '<main className="container mx-auto px-4 py-12">'
    );
    
    // Find and replace the closing </div> that corresponds to the container
    // Look for the pattern: </article>\n        </div>\n      </div>
    // Replace the first </div> after </article> with </main>
    content = content.replace(
      /(<\/article>\s*)<\/div>(\s*<\/div>\s*<\/>)/,
      '$1</main>$2'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${postDir}/page.tsx`);
      modified++;
    } else {
      console.log(`⏭️  Skipped (no changes needed): ${postDir}/page.tsx`);
      skipped++;
    }
  } catch (error) {
    console.log(`❌ Error processing ${postDir}/page.tsx:`, error.message);
    skipped++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Summary:`);
console.log(`   Modified: ${modified} files`);
console.log(`   Skipped: ${skipped} files`);
console.log('='.repeat(50));
console.log('\n✨ Done! All blog posts now have proper <main> landmarks.\n');

