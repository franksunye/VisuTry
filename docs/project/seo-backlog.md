# 📋 SEO Backlog

**Last Updated**: 2025-10-29  
**Current Sprint**: Phase 2 - Indexing (Week 1-2)  

---

## 🚨 Critical (Do First)

### Google Search Console Verification
**Priority**: P0  
**Effort**: 30 min  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Add property: `https://visutry.com`
- [ ] Verify ownership (HTML tag method)
- [ ] Confirm verification successful

**Acceptance**:
- [ ] Can access GSC dashboard
- [ ] Property verified

---

### Submit Sitemap
**Priority**: P0  
**Effort**: 15 min  
**Status**: ⏳ TODO  
**Depends on**: GSC Verification  

**Tasks**:
- [ ] In GSC, go to Sitemaps
- [ ] Submit: `https://visutry.com/sitemap.xml`
- [ ] Verify no errors

**Acceptance**:
- [ ] Sitemap submitted
- [ ] All URLs discovered

---

### Request Blog Post Indexing
**Priority**: P0  
**Effort**: 1 hour  
**Status**: ⏳ TODO  
**Depends on**: Sitemap Submission  

**Tasks**:
- [ ] Use URL Inspection tool in GSC
- [ ] Request indexing for each post:
  - [ ] /blog/prescription-glasses-online-shopping-guide-2025
  - [ ] /blog/how-to-choose-glasses-for-your-face
  - [ ] /blog/browline-clubmaster-glasses-complete-guide
  - [ ] /blog/acetate-vs-plastic-eyeglass-frames-guide
  - [ ] /blog/best-ai-virtual-glasses-tryon-tools-2025
  - [ ] /blog/celebrity-glasses-style-guide-2025
  - [ ] /blog/oliver-peoples-finley-vintage-review
  - [ ] /blog/rayban-glasses-virtual-tryon-guide
  - [ ] /blog/tom-ford-luxury-eyewear-guide-2025

**Acceptance**:
- [ ] All 9 posts requested
- [ ] Indexing status tracked

---

## 🔥 High Priority

### Fix 404 Errors
**Priority**: P1  
**Effort**: 2 hours  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Review 404 errors in GSC
- [ ] Identify patterns
- [ ] Add redirects or fix links
- [ ] Verify fixes

**Acceptance**:
- [ ] < 5 404 errors remaining

---

### Monitor Indexing Progress
**Priority**: P1  
**Effort**: 10 min/day  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Check GSC daily
- [ ] Track indexed posts
- [ ] Log any issues

**Acceptance**:
- [ ] Daily check completed
- [ ] Progress documented

---

## 📊 Medium Priority

### Enable Vercel Analytics
**Priority**: P2  
**Effort**: 15 min  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Go to Vercel dashboard
- [ ] Enable Analytics for project
- [ ] Verify data collection

**Acceptance**:
- [ ] Analytics enabled
- [ ] Data visible in dashboard

---

### Configure Event Tracking
**Priority**: P2  
**Effort**: 1 hour  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Define key events (try-on clicks, uploads)
- [ ] Implement tracking code
- [ ] Test events in GA4
- [ ] Set up conversion goals

**Acceptance**:
- [ ] Events tracking correctly
- [ ] Visible in GA4

---

### Add Internal Links
**Priority**: P2
**Effort**: 2 hours
**Status**: ✅ COMPLETED

**Tasks**:
- [x] Review all blog posts
- [x] Add 3-5 internal links per post
- [x] Link related articles
- [x] Update posts

**Acceptance**:
- [x] All posts have internal links
- [x] Links are contextual

**Completed**: 2025-10-29
**Details**: Added contextual internal links to all 9 blog posts connecting related content on face shapes, brands, materials, and styles. Improves SEO and user navigation.

---

## 💡 Low Priority / Future

### Related Posts Section
**Priority**: P3  
**Effort**: 3 hours  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Design related posts component
- [ ] Implement logic (by tags)
- [ ] Add to blog post template
- [ ] Test on all posts

---

### Table of Contents
**Priority**: P3  
**Effort**: 2 hours  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Create TOC component
- [ ] Auto-generate from headings
- [ ] Add to long posts (> 2000 words)
- [ ] Make sticky on scroll

---

### Custom 404 Page
**Priority**: P3  
**Effort**: 1 hour  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Design 404 page
- [ ] Add search functionality
- [ ] Suggest popular pages
- [ ] Implement in Next.js

---

### MDX Support
**Priority**: P3  
**Effort**: 4 hours  
**Status**: ⏳ TODO  

**Tasks**:
- [ ] Install MDX dependencies
- [ ] Configure Next.js for MDX
- [ ] Create custom components
- [ ] Migrate one post as test

---

## 📅 Backlog (Not Scheduled)

### Content Expansion
- [ ] Write 3-5 new blog posts
- [ ] Focus on face shape guides
- [ ] Target 2,000+ words each

### Social Distribution
- [ ] Share posts on Twitter/X
- [ ] Post to LinkedIn
- [ ] Submit to Reddit
- [ ] Answer Quora questions

### Link Building
- [ ] Guest post outreach
- [ ] Digital PR campaign
- [ ] Create infographics
- [ ] Reach out to bloggers

### Programmatic SEO
- [ ] Design brand landing pages
- [ ] Create style category pages
- [ ] Implement dynamic generation

---

## 📊 Sprint Goals

### Week 1 (Current)
- [ ] GSC verified
- [ ] Sitemap submitted
- [ ] 9/9 posts requested for indexing

### Week 2
- [ ] 3-5 posts indexed
- [ ] 404 errors < 5
- [ ] Event tracking active

### Month 1
- [ ] 9/9 posts indexed
- [ ] 500+ organic sessions
- [ ] 2+ keywords in Top 50

---

**See Also**:
- [Executive Summary](seo-executive-summary.md) - Completed work & achievements
- [Next Sprint](../NEXT_SPRINT.md) - Detailed week 1-2 plan

