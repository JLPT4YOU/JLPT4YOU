# 🗑️ Trash - Removed Files Log

This directory contains files that were removed during refactoring for backup purposes.

## 2025-07-11 - JLPT Routing Refactor

**Reason**: Consolidated 10 duplicate JLPT level pages into 1 dynamic route

**Files Removed**:
- `src/app/jlpt/official/n1/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/official/n2/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/official/n3/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/official/n4/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/official/n5/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/custom/n1/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/custom/n2/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/custom/n3/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/custom/n4/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`
- `src/app/jlpt/custom/n5/page.tsx` → Replaced by `src/app/jlpt/[type]/[level]/page.tsx`

**Impact**: 
- ✅ All URLs still work: `/jlpt/official/n1`, `/jlpt/custom/n3`, etc.
- ✅ Reduced code duplication from 120 lines to 40 lines (67% reduction)
- ✅ Easier maintenance - only 1 file to update instead of 10
- ✅ Better scalability - adding new levels doesn't require new files

**Testing**: All routes tested and confirmed working on http://localhost:3005

## 2025-07-11 - Demo & Test Pages Cleanup

**Reason**: Clean up codebase by removing unnecessary demo and test pages

**Files Removed**:
- `src/app/auth-demo/` → Authentication demo page
- `src/app/pattern-demo/` → Background pattern showcase
- `src/app/driving-demo/` → Driving test demo
- `src/app/results-demo/` → Exam results demo scenarios
- `src/app/review-demo/` → Review answers demo
- `src/app/test-demo/` → General test demo
- `src/app/submission-demo/` → Submission flow demo
- `src/app/submission-challenge-demo/` → Challenge submission demo
- `src/app/header-test-*` → Header testing pages
- `src/app/modals-test-*` → Modal testing pages
- `src/app/question-test-*` → Question testing pages
- `src/app/sidebar-test-*` → Sidebar testing pages
- `src/app/state-test-*` → State testing pages
- `src/app/test-pause/` → Test pause functionality
- `src/app/test-popup/` → Test popup functionality

**Impact**:
- ✅ Cleaner codebase with 16+ demo/test pages removed
- ✅ Better organization focusing on production features
- ✅ Faster builds and easier maintenance
- ✅ Core features preserved: auth, JLPT, challenge, driving, exam results

**Testing**: All core routes tested and confirmed working on http://localhost:3004
