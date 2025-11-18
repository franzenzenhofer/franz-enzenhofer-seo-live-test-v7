# CLAUDE.md - F19N Obtrusive Live Test v7 Chrome Extension

## Project Overview
Production-ready Chrome Extension (Manifest V3) for SEO/performance testing with Chrome DevTools-inspired UI.

## OAuth Configuration
**See [README.md - OAuth Configuration](README.md#oauth-configuration-google-search-console--analytics) for complete setup.**

**Critical values (DO NOT CHANGE):**
- OAuth Client ID: `335346275770-6d6s9ja0h7brn24ghf3vqa9kv7ko5vfv`
- Extension ID: `jbnaibigcohjfefpfocphcjeliohhold` (generated from DEV_EXTENSION_KEY)
- All values in `config.js` match the published Chrome Web Store extension

## Architecture
- **Side Panel UI**: React 18 + Tailwind CSS + Vite
- **Service Worker**: Background event processing + Chrome alarms
- **Offscreen Document**: Sandboxed rule execution (no eval in SW)
- **Storage Contract**: chrome.storage.local for results, chrome.storage.session for events

## Development Commands

### Quick Start
```bash
cd v7
npm install
npm run build
# Load dist/ folder in chrome://extensions
```

### Daily Development Workflow
```bash
npm run dev          # Start Vite dev server (hot reload)
npm run check:watch  # Auto typecheck + lint on file changes
npm run test:watch   # Run tests in watch mode
```

### Quality Gates (MUST PASS before commit)
```bash
npm run typecheck    # Zero TypeScript errors allowed
npm run lint         # Zero ESLint violations allowed
npm run test         # All tests must pass
npm run build        # Must build successfully
```

### Production Build & Deploy
```bash
npm run dist         # Build + create dist.zip for Chrome Web Store
npm run bump         # Auto-increment version before build
```

## Enhanced Reporting System

**See [/ENHANCED-REPORTING.md](../ENHANCED-REPORTING.md) for complete design documentation.**

### Key Principles
- **Two-Layer UX**: Quick view (inline snippets) + Deep detail view (full inspection)
- **DRY Code**: Integrate enhancements into EXISTING rules, no duplicate `-enhanced` versions
- **Rich Data**: Every result includes HTML snippets, DOM paths, HTTP headers where applicable
- **Tab Reuse**: Detail view opens in single reusable tab (no tab explosion)
- **Debugging-First**: Perfect for testers/debuggers who need to see raw data

### Required in Every Rule
1. **sourceHtml**: Complete outerHTML of inspected elements
2. **snippet**: First 100 chars for quick preview
3. **domPath**: CSS selector path to element
4. **httpHeaders**: For HTTP-related rules (status, headers, etc.)

## Code Standards

### File Size Limit
- **STRICT**: All code files in `src/` must be ≤75 lines (enforced by ESLint)
- **Exception**: Rule modules under `src/rules/**` may be ≤150 lines to keep logic + detail payloads together
- Non-code files (configs, docs, data) can be larger
- Split large modules aggressively
- One responsibility per file

### TypeScript Requirements
- Strict mode enabled (no implicit any)
- All functions must have explicit return types
- No `@ts-ignore` or `@ts-expect-error` comments

### Testing Requirements
- One test file per module
- Test coverage target: >80%
- Mock Chrome APIs minimally
- No network I/O in tests

### Component Guidelines
- React components: Functional only (no class components)
- Props: Use explicit types (no `any`)
- State: Zustand for global, useState for local
- Effects: Clean up subscriptions properly

## UI Framework: TAILWIND CSS ONLY

### This project uses TAILWIND CSS
- **DO NOT** create custom CSS files
- **DO NOT** use inline styles
- **DO NOT** create CSS-in-JS
- **USE ONLY** Tailwind utility classes
- Check `tailwind.config.ts` for custom configurations
- All styling through className with Tailwind classes

### Common Tailwind Patterns in this Project
```jsx
// Buttons
<button className="border px-2 py-1 rounded hover:bg-gray-50">

// Cards
<div className="border rounded p-4 space-y-2">

// Layout
<div className="flex items-center justify-between gap-2">

// Text
<span className="text-sm text-gray-600">
```


## Chrome Extension Specifics

### Manifest Permissions
- Principle of least privilege
- Document why each permission is needed
- No broad host permissions without justification

### Content Script Injection
- Inject on-demand only (not on all pages)
- Clean up when tab closes
- Handle CSP restrictions gracefully

### Storage Patterns
- `chrome.storage.local`: Persistent user data
- `chrome.storage.session`: Temporary runtime data
- `chrome.storage.sync`: User preferences (if logged in)

## Production Readiness Checklist

### Before Each Release
- [ ] Version bumped in manifest.json and package.json
- [ ] All quality gates pass (typecheck, lint, test, build)
- [ ] Manual testing in Chrome (side panel loads, rules execute)
- [ ] Console free of errors/warnings
- [ ] Performance: <100ms rule execution time
- [ ] Memory: No leaks after 1hr usage

### Security Requirements
- Never log sensitive data (API keys, user data)
- Validate all external inputs with Zod
- Sanitize HTML before rendering
- Use HTTPS for all external requests
- No eval() or new Function() in production code

## THINK BEFORE CODE - MANDATORY WORKFLOW

### Before ANY Coding:
1. **UNDERSTAND the existing codebase**
   - Check what UI framework is used (Tailwind, Material-UI, custom CSS?)
   - Review existing patterns and components
   - Understand the architecture and data flow
   - Check for existing similar functionality

2. **THINK through the solution**
   - Plan the complete approach
   - Consider existing code reuse
   - Identify potential issues
   - Design the component hierarchy

3. **CHECK existing code**
   - Search for similar implementations
   - Review import patterns
   - Understand file organization
   - Check for utility functions

4. **ONLY THEN start coding**
   - Follow existing patterns
   - Use the same UI framework (TAILWIND in this project!)
   - Maintain consistency

## Atomic CI Commits - CRITICAL PRACTICE

### Commit After EVERY File Change
**MANDATORY**: Make atomic commits after each file modification:

1. Make ONE file change
2. Run `npm run typecheck` - MUST PASS
3. Run `npm run lint` - MUST PASS
4. Commit with descriptive message
5. REPEAT for next file

**Why this matters:**
- Complete history tracking
- Easy rollback if needed
- Clear change documentation
- Catches errors immediately

### Commit Message Format
```bash
# After each file change:
git add <specific-file>
git commit -m "<type>(<scope>): <subject>"

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation
# style: Formatting, missing semicolons, etc.
# refactor: Code restructuring
# perf: Performance improvements
# test: Test additions/modifications
# chore: Build process, auxiliary tools

# Examples:
git commit -m "fix(sidepanel): resolve Tab type mismatch"
git commit -m "feat(ui): add Chrome DevTools theme variables"
git commit -m "refactor(rules): extract duplicate validation logic"
```

### Automated Commit Workflow
```bash
# Set up auto-commit on file save (development only):
npm run dev & npm run check:watch &
# Use git-auto-commit or husky for automated commits

# Pre-commit hooks (already configured):
# - TypeScript check
# - ESLint check
# - Prettier format
```

## Common Tasks

### Add New Rule
1. Create rule in `src/rules/[category]/[name].ts`
2. Add to registry in `src/rules/registry.ts`
3. Create test in `tests/rules/[category].[name].test.ts`
4. Verify with `npm run test`

### Debug Service Worker
```javascript
// In background/index.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated')
})
// View logs in: chrome://extensions > Service Worker "Inspect"
```

### Debug Side Panel
1. Open DevTools on any page
2. Click extension icon to open side panel
3. Right-click panel > Inspect to debug

## Performance Guidelines
- Debounce storage writes (100ms minimum)
- Batch DOM operations in rules
- Use chrome.alarms for delayed tasks (not setTimeout)
- Limit concurrent rule executions to 5

## Known Issues & Solutions

### Issue: Side panel not updating
**Solution**: Check storage subscription in Results.tsx

### Issue: Rules not executing
**Solution**: Verify offscreen document creation in background/rules/offscreen.ts

### Issue: High memory usage
**Solution**: Clear old results with auto-clear option or limit storage

## Contact & Support
- Repository: Private (franz-enzenhofer-seo-live-test-v7)
- Primary Developer: Franz Enzenhofer
- Chrome Web Store: [pending]

## Quick Reference

### Run Everything
```bash
npm run ci  # typecheck + lint + test + build
```

### Fix Common Issues
```bash
npm run format       # Auto-fix formatting
npm run lint -- --fix  # Auto-fix lint issues
```

### Development Tips
1. Use `npm run dev` + `npm run check:watch` in split terminals
2. Keep Chrome DevTools open to see extension logs
3. Use React DevTools extension for debugging components
4. Enable "Errors" pause in DevTools for debugging

---
Last Updated: 2025-09-19
Version: 0.1.54
