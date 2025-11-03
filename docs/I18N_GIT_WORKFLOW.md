# 🌿 i18n Git Workflow Guide

## Branch Strategy

### Main Branch Protection
- `main` branch is **protected** - production code only
- All i18n work happens in feature branch
- Merge only after thorough testing and review

### Feature Branch
```bash
feature/i18n-multi-language
```

---

## 🚀 Getting Started

### Step 1: Create Feature Branch

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create and switch to feature branch
git checkout -b feature/i18n-multi-language

# Verify you're on the right branch
git branch
# Output should show: * feature/i18n-multi-language
```

### Step 2: Push Branch to Remote

```bash
# Push branch to GitHub
git push -u origin feature/i18n-multi-language
```

---

## 📝 Commit Strategy

### Commit Often, Commit Small

**Good Practice**: Make small, focused commits
- ✅ Each commit = one logical change
- ✅ Easy to review
- ✅ Easy to revert if needed
- ✅ Clear history

**Bad Practice**: Large, monolithic commits
- ❌ Hard to review
- ❌ Hard to debug
- ❌ Risky to revert

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

**Scope**: Always use `i18n`

**Examples:**
```bash
feat(i18n): install next-intl and setup configuration
feat(i18n): restructure routes to [locale] pattern
feat(i18n): add language switcher component
refactor(i18n): extract hardcoded text from homepage
fix(i18n): correct Arabic RTL layout issues
docs(i18n): add translation guide for contributors
test(i18n): add tests for language switching
```

---

## 🔄 Recommended Commit Sequence

### Phase 1: Foundation (5 commits)

```bash
# Commit 1: Dependencies
git add package.json package-lock.json
git commit -m "feat(i18n): install next-intl dependency"

# Commit 2: Configuration
git add src/i18n.ts src/i18n/
git commit -m "feat(i18n): add language configuration for 9 locales"

# Commit 3: Route restructure
git add src/app/[locale]/
git commit -m "feat(i18n): restructure routes to [locale] pattern"

# Commit 4: Middleware
git add src/middleware.ts
git commit -m "feat(i18n): update middleware for language detection"

# Commit 5: Translation files
git add messages/
git commit -m "feat(i18n): create translation file structure"

# Push to remote
git push
```

### Phase 2: Translation (3-4 commits)

```bash
# Commit 6: Extract homepage
git add src/app/[locale]/(main)/page.tsx messages/en.json
git commit -m "refactor(i18n): extract hardcoded text from homepage"

# Commit 7: Extract pricing
git add src/app/[locale]/(main)/pricing/ messages/en.json
git commit -m "refactor(i18n): extract hardcoded text from pricing page"

# Commit 8: Extract try-on
git add src/app/[locale]/(main)/try-on/ messages/en.json
git commit -m "refactor(i18n): extract hardcoded text from try-on flow"

# Commit 9: Translations
git add messages/*.json
git commit -m "feat(i18n): add translations for 8 languages"

git push
```

### Phase 3: Features (3-4 commits)

```bash
# Commit 10: Language switcher
git add src/components/LanguageSwitcher.tsx
git commit -m "feat(i18n): add language switcher component"

# Commit 11: RTL support
git add tailwind.config.js src/app/[locale]/layout.tsx
git commit -m "feat(i18n): add RTL support for Arabic"

# Commit 12: SEO
git add src/lib/seo.ts src/app/sitemap.ts
git commit -m "feat(i18n): add multi-language SEO and sitemap"

git push
```

### Phase 4: Testing & Docs (2-3 commits)

```bash
# Commit 13: Tests
git add tests/
git commit -m "test(i18n): add language switching tests"

# Commit 14: Documentation
git add docs/I18N_*.md README.md
git commit -m "docs(i18n): add implementation guide and checklist"

git push
```

---

## 🔍 Before Each Commit

### Pre-Commit Checklist

```bash
# 1. Check what files changed
git status

# 2. Review changes
git diff

# 3. Stage only related files
git add <specific-files>

# 4. Verify staged changes
git diff --staged

# 5. Run build to catch errors
npm run build

# 6. Commit with clear message
git commit -m "feat(i18n): <description>"
```

---

## 🧪 Testing Before Push

### Local Testing

```bash
# 1. Build the project
npm run build

# 2. Run tests
npm test

# 3. Start production server
npm start

# 4. Manual testing
# - Test all languages
# - Test language switcher
# - Test core flows
```

### If Tests Fail

```bash
# Fix the issues, then amend the last commit
git add <fixed-files>
git commit --amend --no-edit

# Or create a new fix commit
git commit -m "fix(i18n): resolve build errors"
```

---

## 🔄 Syncing with Main

### Keep Feature Branch Updated

```bash
# Fetch latest changes from main
git fetch origin main

# Rebase your feature branch on top of main
git rebase origin/main

# If conflicts occur, resolve them:
# 1. Fix conflicts in files
# 2. git add <resolved-files>
# 3. git rebase --continue

# Force push (rebase rewrites history)
git push --force-with-lease
```

**When to sync:**
- Before creating PR
- If main has important updates
- Every few days during long development

---

## 📤 Creating Pull Request

### Step 1: Final Checks

```bash
# 1. Make sure all changes committed
git status
# Should show: "nothing to commit, working tree clean"

# 2. Sync with main one last time
git fetch origin main
git rebase origin/main

# 3. Run full test suite
npm run build
npm test

# 4. Push final changes
git push
```

### Step 2: Create PR on GitHub

**PR Title:**
```
feat: Add multi-language support (9 languages)
```

**PR Description Template:**
```markdown
## 🌍 Multi-Language Support

### Summary
Adds internationalization (i18n) support for 9 languages using next-intl.

### Languages Added
- 🇬🇧 English (en) - default
- 🇮🇩 Indonesian (id)
- 🇸🇦 Arabic (ar) - RTL support
- 🇷🇺 Russian (ru)
- 🇩🇪 German (de)
- 🇯🇵 Japanese (ja)
- 🇪🇸 Spanish (es)
- 🇵🇹 Portuguese (pt)
- 🇫🇷 French (fr)

### Changes
- ✅ Restructured routes to `[locale]` pattern
- ✅ Added next-intl for translation management
- ✅ Created translation files for all languages
- ✅ Implemented language switcher component
- ✅ Added RTL support for Arabic
- ✅ Updated SEO configuration with hreflang
- ✅ Generated multi-language sitemap

### Testing
- [x] All languages accessible via URL
- [x] Language switcher works
- [x] Core flows tested in all languages
- [x] RTL layout verified for Arabic
- [x] SEO tags validated
- [x] Performance benchmarked

### Screenshots
[Add screenshots of language switcher and different language versions]

### Documentation
- Implementation plan: `docs/I18N_IMPLEMENTATION_PLAN.md`
- Task checklist: `docs/I18N_TASK_CHECKLIST.md`
- Git workflow: `docs/I18N_GIT_WORKFLOW.md`

### Breaking Changes
⚠️ URL structure changed:
- Before: `/pricing`
- After: `/en/pricing` (or `/pricing` redirects to `/en/pricing`)

### Migration Notes
- Existing URLs will redirect automatically
- No database migration required
- Environment variables: none added

### Deployment Notes
- No special deployment steps required
- Sitemap will regenerate on build
- Submit new sitemap to Google Search Console after deployment

### Checklist
- [x] Code builds without errors
- [x] All tests passing
- [x] Documentation updated
- [x] No console errors
- [x] Performance acceptable
- [x] SEO validated
- [ ] Reviewed by team member
- [ ] Ready to merge

---

Closes #[issue-number] (if applicable)
```

### Step 3: Request Review

- Assign reviewers
- Add labels: `enhancement`, `i18n`
- Link to related issues
- Wait for approval

---

## 🔀 Merging Strategy

### Option A: Squash and Merge (Recommended)

**Pros:**
- Clean main branch history
- One commit per feature
- Easy to revert

**Cons:**
- Loses detailed commit history

**When to use:** Most cases

### Option B: Rebase and Merge

**Pros:**
- Preserves all commits
- Detailed history

**Cons:**
- Cluttered main branch

**When to use:** When commit history is important

### Option C: Merge Commit

**Pros:**
- Preserves branch structure

**Cons:**
- Creates merge commits

**When to use:** Rarely

---

## 🚨 Emergency: Reverting Changes

### If Something Goes Wrong After Merge

```bash
# Find the merge commit
git log --oneline

# Revert the merge
git revert -m 1 <merge-commit-hash>

# Push revert
git push origin main
```

### If Need to Fix in Feature Branch

```bash
# Switch back to feature branch
git checkout feature/i18n-multi-language

# Make fixes
# ... edit files ...

# Commit fixes
git add .
git commit -m "fix(i18n): resolve critical issue"

# Push
git push

# Update PR (it will auto-update)
```

---

## 📊 Monitoring After Merge

### Post-Merge Checklist

```bash
# 1. Verify deployment
# Visit production site

# 2. Check all languages work
# Test: /en, /id, /es, /ar, /ru, /de, /ja, /pt, /fr

# 3. Monitor error logs
# Check Vercel dashboard or logging service

# 4. Check analytics
# Verify language detection working

# 5. Submit sitemap
# Google Search Console
```

### If Issues Found

```bash
# Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/i18n-critical-fix

# Make fix
# ... edit files ...

# Commit and push
git add .
git commit -m "fix(i18n): resolve critical production issue"
git push -u origin hotfix/i18n-critical-fix

# Create PR for hotfix
# Merge immediately after review
```

---

## 🎓 Best Practices

### DO ✅

- Commit often with clear messages
- Test before every push
- Keep feature branch synced with main
- Write descriptive PR descriptions
- Request reviews from team members
- Update documentation

### DON'T ❌

- Commit directly to main
- Push untested code
- Make huge commits
- Use vague commit messages
- Force push to main
- Merge without review

---

## 🔧 Useful Git Commands

```bash
# View commit history
git log --oneline --graph

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# View changes in a file
git diff <file>

# Stash changes temporarily
git stash
git stash pop

# Cherry-pick a commit
git cherry-pick <commit-hash>

# View branch differences
git diff main...feature/i18n-multi-language

# Clean untracked files
git clean -fd
```

---

## 📞 Getting Help

### If Stuck

1. Check this guide
2. Check Git documentation
3. Ask team member
4. Search Stack Overflow
5. Use `git status` to understand current state

### Common Questions

**Q: I made a mistake in my last commit. How do I fix it?**
```bash
# If not pushed yet
git commit --amend

# If already pushed
git revert HEAD
```

**Q: I have merge conflicts. What do I do?**
```bash
# 1. Open conflicted files
# 2. Look for <<<<<<< markers
# 3. Resolve conflicts manually
# 4. Remove conflict markers
# 5. git add <resolved-files>
# 6. git rebase --continue (if rebasing)
# 7. git commit (if merging)
```

**Q: How do I undo a push?**
```bash
# Revert the commit (creates new commit)
git revert <commit-hash>
git push

# Or reset (dangerous, rewrites history)
git reset --hard <commit-hash>
git push --force-with-lease
```

---

**Last Updated**: 2025-11-03  
**Status**: Ready to Use  
**Next Action**: Create feature branch and start Phase 1

