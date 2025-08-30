# Translation Hooks Cleanup Plan

## Problem Analysis
- **useTranslations** và **useLanguageContext** là duplicate code với functionality gần như giống hệt nhau
- useTranslations được sử dụng trong **74 files**
- useLanguageContext chỉ được sử dụng trong **8 files**

## Strategy Decision: Enhance useTranslations + Migrate useLanguageContext

**Lý do chọn strategy này:**
- Ít công việc nhất (8 files vs 74 files)
- Giữ được stability của codebase hiện tại
- useTranslations đã được proven và widely used
- Vẫn có được benefits của useLanguageContext

## Migration Plan

### Phase 1: Enhance useTranslations Hook
**Files to modify:**
- `src/hooks/use-translations.ts`

**Enhancements to add:**
1. **Error handling:**
   - Add `error: Error | null` to return interface
   - Add `retryLoadTranslations: () => Promise<void>` function
   - Add error state management

2. **Fallback translations support:**
   - Enhance translation function with fallback support
   - Load default language as fallback when current language is not default

3. **Optional props support:**
   - Add `initialLanguage?: Language` parameter
   - Add `initialTranslations?: TranslationData` parameter

### Phase 2: Migrate Files from useLanguageContext to useTranslations

**Files to migrate (8 files):**
1. `src/components/language-page-wrapper.tsx`
2. `src/components/header.tsx`
3. `src/components/language-switcher.tsx`
4. `src/components/theme-toggle.tsx`
5. `src/components/premium/modern-checkout.tsx`
6. `src/components/premium/modern-pricing-page.tsx`
7. `src/components/premium/thank-you-modal.tsx`

**Migration steps for each file:**
1. Change import from `useLanguageContext` to `useTranslations`
2. Update destructuring to match useTranslations interface
3. Handle any specific useLanguageContext features (error, retryLoadTranslations)
4. Test functionality

### Phase 3: Remove LanguageProvider Usage

**Files that might use LanguageProvider:**
- Check `src/app/layout.tsx` or other root components
- Remove LanguageProvider wrapper if exists
- Ensure useTranslations works without provider

### Phase 4: Cleanup

**Files to remove:**
- `src/contexts/language-context.tsx`

**Verification:**
- Ensure no remaining imports of useLanguageContext
- Run grep to verify complete removal

## Detailed Implementation Steps

### Step 1: Enhance useTranslations
```typescript
// Add to UseTranslationsReturn interface:
interface UseTranslationsReturn {
  language: Language
  translations: TranslationData | null
  isLoading: boolean
  isAuthenticated: boolean
  t: (key: string) => string
  switchLanguage: (newLanguage: Language) => void
  error: Error | null  // NEW
  retryLoadTranslations: () => Promise<void>  // NEW
}

// Add to useTranslations function parameters:
export function useTranslations(
  initialLanguage?: Language,  // NEW
  initialTranslations?: TranslationData  // NEW
): UseTranslationsReturn
```

### Step 2: Migration Template
```typescript
// Before:
import { useLanguageContext } from '@/contexts/language-context'
const { t, language, switchLanguage, error, retryLoadTranslations } = useLanguageContext()

// After:
import { useTranslations } from '@/hooks/use-translations'
const { t, language, switchLanguage, error, retryLoadTranslations } = useTranslations()
```

## Risk Assessment

**Low Risk:**
- useTranslations is already widely used and tested
- Only 8 files need migration
- Functionality is very similar

**Potential Issues:**
- LanguageProvider context might be used in root layout
- Some components might depend on provider pattern
- Need to ensure error handling works correctly

## Testing Plan

1. **Unit Tests:**
   - Test enhanced useTranslations hook
   - Test error scenarios
   - Test fallback translations

2. **Integration Tests:**
   - Test each migrated component
   - Test language switching
   - Test error recovery

3. **Manual Testing:**
   - Test all pages with language switching
   - Test error scenarios
   - Test authentication flows

## Rollback Plan

If issues occur:
1. Revert useTranslations enhancements
2. Restore useLanguageContext usage in migrated files
3. Keep both hooks temporarily until issues resolved

## Success Criteria

- [ ] All 8 files successfully migrated
- [ ] No remaining useLanguageContext imports
- [ ] All language switching functionality works
- [ ] Error handling works correctly
- [ ] No performance regressions
- [ ] All tests pass
