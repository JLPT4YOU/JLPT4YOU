# Translation Hooks Migration Plan

## Objective
Consolidate duplicate translation hooks by migrating from `useTranslations` to `useLanguageContext` for better consistency and real-time language switching.

## Current State
- **useLanguageContext**: Main hook connected to LanguageProvider, supports real-time updates
- **useTranslations**: Duplicate hook with similar functionality but potential sync delays
- **193+ files** currently using `useTranslations`

## Migration Strategy

### Phase 1: Backup & Preparation ✅
- [x] Create backup of critical files
- [x] Document migration plan
- [x] Identify all files using useTranslations

### Phase 2: Critical Components (High Priority)
Target components with language switching issues:
- [x] ExerciseGenerator.tsx
- [x] StudyPracticePageContent.tsx
- [ ] Header components
- [ ] Language switcher components

### Phase 3: Core Components (Medium Priority)
- [ ] Auth components (login, register, etc.)
- [ ] Main navigation components
- [ ] Study pages and practice components
- [ ] Premium/payment components

### Phase 4: Secondary Components (Low Priority)
- [ ] Chat components
- [ ] Review components
- [ ] Utility components

### Phase 5: Cleanup
- [ ] Remove use-translations.ts
- [ ] Update imports across codebase
- [ ] Test all language switching functionality

## Migration Steps per Component
1. Replace import: `useTranslations` → `useLanguageContext`
2. Update hook usage: `const { t } = useTranslations()` → `const { t } = useLanguageContext()`
3. Test component functionality
4. Verify language switching works correctly

## Risk Mitigation
- Migrate in small batches
- Test each batch before proceeding
- Keep backups of original files
- Rollback plan if issues occur

## Success Criteria
- All components use single translation hook
- Language switching works consistently across app
- No duplicate translation logic
- Improved performance and maintainability
