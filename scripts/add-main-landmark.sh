#!/bin/bash

# Script to add <main> landmark to all blog post pages
# This fixes the accessibility issue identified in PageSpeed Insights

echo "Adding <main> landmark to blog post pages..."

# List of blog post directories
BLOG_POSTS=(
  "browline-clubmaster-glasses-complete-guide"
  "acetate-vs-plastic-eyeglass-frames-guide"
  "best-ai-virtual-glasses-tryon-tools-2025"
  "celebrity-glasses-style-guide-2025"
  "how-to-choose-glasses-for-your-face"
  "oliver-peoples-finley-vintage-review"
  "rayban-glasses-virtual-tryon-guide"
  "tom-ford-luxury-eyewear-guide-2025"
)

# Base directory
BASE_DIR="src/app/(main)/blog"

# Counter for modified files
MODIFIED=0

for post in "${BLOG_POSTS[@]}"; do
  FILE="$BASE_DIR/$post/page.tsx"
  
  if [ -f "$FILE" ]; then
    echo "Processing: $FILE"
    
    # Replace <div className="container with <main className="container
    sed -i 's/<div className="container mx-auto px-4 py-12">/<main className="container mx-auto px-4 py-12">/g' "$FILE"
    
    # Replace closing </div> before </div> </> with </main>
    # This is a bit tricky, so we'll do it carefully
    # Find the pattern: </div>\n      </div>\n    </>\n  )\n}
    # And replace the first </div> with </main>
    
    # Use perl for more complex replacement
    perl -i -pe 's/(<\/article>\s*<\/div>)(\s*<\/div>\s*<\/>)/$1\n        <\/main>$2/g' "$FILE" 2>/dev/null || true
    
    ((MODIFIED++))
    echo "  ✓ Modified"
  else
    echo "  ✗ File not found: $FILE"
  fi
done

echo ""
echo "Summary: Modified $MODIFIED files"
echo "Done!"

