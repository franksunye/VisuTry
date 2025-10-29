#!/usr/bin/env node

/**
 * Add Internal Links to Blog Posts
 * 
 * This script adds contextual internal links to blog posts
 * to improve SEO and user navigation.
 */

const fs = require('fs');
const path = require('path');

// Internal link mappings
const linkMappings = {
  'browline-clubmaster-glasses-complete-guide': [
    {
      search: 'face shape',
      replace: '<Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape</Link>',
      maxOccurrences: 1
    },
    {
      search: 'acetate frames',
      replace: '<Link href="/blog/acetate-vs-plastic-eyeglass-frames-guide" className="text-blue-600 hover:text-blue-800">acetate frames</Link>',
      maxOccurrences: 1
    },
    {
      search: 'celebrity style',
      replace: '<Link href="/blog/celebrity-glasses-style-guide-2025" className="text-blue-600 hover:text-blue-800">celebrity style</Link>',
      maxOccurrences: 1
    }
  ],
  'acetate-vs-plastic-eyeglass-frames-guide': [
    {
      search: 'buying glasses online',
      replace: '<Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">buying glasses online</Link>',
      maxOccurrences: 1
    },
    {
      search: 'browline frames',
      replace: '<Link href="/blog/browline-clubmaster-glasses-complete-guide" className="text-blue-600 hover:text-blue-800">browline frames</Link>',
      maxOccurrences: 1
    },
    {
      search: 'luxury eyewear',
      replace: '<Link href="/blog/tom-ford-luxury-eyewear-guide-2025" className="text-blue-600 hover:text-blue-800">luxury eyewear</Link>',
      maxOccurrences: 1
    }
  ],
  'best-ai-virtual-glasses-tryon-tools-2025': [
    {
      search: 'online shopping',
      replace: '<Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">online shopping</Link>',
      maxOccurrences: 1
    },
    {
      search: 'Ray-Ban',
      replace: '<Link href="/blog/rayban-glasses-virtual-tryon-guide" className="text-blue-600 hover:text-blue-800">Ray-Ban</Link>',
      maxOccurrences: 1
    },
    {
      search: 'face shape',
      replace: '<Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape</Link>',
      maxOccurrences: 1
    }
  ],
  'celebrity-glasses-style-guide-2025': [
    {
      search: 'face shape',
      replace: '<Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape</Link>',
      maxOccurrences: 1
    },
    {
      search: 'Ray-Ban',
      replace: '<Link href="/blog/rayban-glasses-virtual-tryon-guide" className="text-blue-600 hover:text-blue-800">Ray-Ban</Link>',
      maxOccurrences: 1
    },
    {
      search: 'Tom Ford',
      replace: '<Link href="/blog/tom-ford-luxury-eyewear-guide-2025" className="text-blue-600 hover:text-blue-800">Tom Ford</Link>',
      maxOccurrences: 1
    }
  ],
  'oliver-peoples-finley-vintage-review': [
    {
      search: 'acetate',
      replace: '<Link href="/blog/acetate-vs-plastic-eyeglass-frames-guide" className="text-blue-600 hover:text-blue-800">acetate</Link>',
      maxOccurrences: 1
    },
    {
      search: 'celebrity',
      replace: '<Link href="/blog/celebrity-glasses-style-guide-2025" className="text-blue-600 hover:text-blue-800">celebrity</Link>',
      maxOccurrences: 1
    },
    {
      search: 'prescription',
      replace: '<Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">prescription</Link>',
      maxOccurrences: 1
    }
  ],
  'rayban-glasses-virtual-tryon-guide': [
    {
      search: 'AI virtual try-on',
      replace: '<Link href="/blog/best-ai-virtual-glasses-tryon-tools-2025" className="text-blue-600 hover:text-blue-800">AI virtual try-on</Link>',
      maxOccurrences: 1
    },
    {
      search: 'online shopping',
      replace: '<Link href="/blog/prescription-glasses-online-shopping-guide-2025" className="text-blue-600 hover:text-blue-800">online shopping</Link>',
      maxOccurrences: 1
    },
    {
      search: 'face shape',
      replace: '<Link href="/blog/how-to-choose-glasses-for-your-face" className="text-blue-600 hover:text-blue-800">face shape</Link>',
      maxOccurrences: 1
    }
  ],
  'tom-ford-luxury-eyewear-guide-2025': [
    {
      search: 'celebrity',
      replace: '<Link href="/blog/celebrity-glasses-style-guide-2025" className="text-blue-600 hover:text-blue-800">celebrity</Link>',
      maxOccurrences: 1
    },
    {
      search: 'acetate',
      replace: '<Link href="/blog/acetate-vs-plastic-eyeglass-frames-guide" className="text-blue-600 hover:text-blue-800">acetate</Link>',
      maxOccurrences: 1
    },
    {
      search: 'Oliver Peoples',
      replace: '<Link href="/blog/oliver-peoples-finley-vintage-review" className="text-blue-600 hover:text-blue-800">Oliver Peoples</Link>',
      maxOccurrences: 1
    }
  ]
};

const baseDir = path.join(process.cwd(), 'src/app/(main)/blog');

let modified = 0;
let skipped = 0;

console.log('🔗 Adding internal links to blog posts...\n');

Object.keys(linkMappings).forEach(postSlug => {
  const filePath = path.join(baseDir, postSlug, 'page.tsx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${postSlug}/page.tsx`);
    skipped++;
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let linksAdded = 0;
    
    // Add each link mapping
    linkMappings[postSlug].forEach(mapping => {
      const regex = new RegExp(mapping.search, 'gi');
      let count = 0;
      
      content = content.replace(regex, (match) => {
        if (count < mapping.maxOccurrences) {
          count++;
          linksAdded++;
          return mapping.replace;
        }
        return match;
      });
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${postSlug}: Added ${linksAdded} links`);
      modified++;
    } else {
      console.log(`⏭️  ${postSlug}: No changes needed`);
      skipped++;
    }
  } catch (error) {
    console.log(`❌ Error processing ${postSlug}:`, error.message);
    skipped++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Summary:`);
console.log(`   Modified: ${modified} files`);
console.log(`   Skipped: ${skipped} files`);
console.log('='.repeat(50));
console.log('\n✨ Internal links added successfully!\n');

