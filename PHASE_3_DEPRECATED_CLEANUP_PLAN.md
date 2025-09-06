# 🧹 PHASE 3: DEPRECATED CODE CLEANUP PLAN
*Ngày: 2025-09-05*

## 🎯 MỤC TIÊU
Loại bỏ deprecated code, legacy scripts và tối ưu hóa service patterns để chuẩn bị production sạch sẽ.

**Thời gian ước tính:** 1-2 giờ  
**Mức độ:** 🟡 Important - Code quality & maintainability

---

## 📋 TARGET AREAS ĐÃ XÁC ĐỊNH

### 🔴 1. Prompt Storage Cleanup (30 mins)
**File:** `src/lib/prompt-storage.ts`
**Issue:** 10 deprecated methods với console.warn statements

**Deprecated Methods Found:**
```typescript
- getCustomPromptConfig() // @deprecated
- saveCustomPromptConfig() // @deprecated 
- resetToDefaultPrompt() // @deprecated
- getAICommunicationLanguage() // @deprecated
```

**Action Plan:**
- ✅ **Remove** deprecated methods hoàn toàn
- ✅ **Update imports** từ các file khác sử dụng methods này
- ✅ **Clean up** console.warn statements
- ✅ **Keep** active methods phục vụ current workflow

### 🟡 2. Auth Validation Update (15 mins)
**File:** `src/lib/auth-validation.ts`  
**Issue:** 2 deprecated methods với backward compatibility

**Deprecated Methods Found:**
```typescript
- createAuthValidator() // deprecated - use hook-based validation
```

**Action Plan:**
- ✅ **Remove** deprecated factory function
- ✅ **Verify** hook-based validation đã được implement đầy đủ
- ✅ **Update** references to new pattern

### 🟢 3. Legacy Scripts Review (30 mins)
**Files:** `scripts/` directory
**Issue:** Legacy auth migration scripts có thể đã obsolete

**Scripts Found:**
```bash
- audit-legacy-auth.sh
- cleanup-legacy-auth.sh  
- remove-legacy-files.sh
```

**Action Plan:**
- 🔍 **Review** xem migration đã hoàn thành chưa
- 📋 **Document** scripts nào còn cần thiết
- 🗑️ **Archive** or **Remove** obsolete scripts
- ✅ **Keep** scripts còn active

### 🟡 4. Service Pattern Consolidation (30 mins)
**Files:** Unified service wrappers
**Issue:** Re-export wrappers cho backward compatibility

**Files Found:**
```typescript
- gemini-service-unified.ts // Re-export wrapper  
- groq-service-unified.ts   // Unified implementation
```

**Action Plan:**
- 🔍 **Analyze** usage patterns của unified vs modular services
- 📊 **Check imports** xem có file nào còn dùng unified không
- ✅ **Migrate** imports to new modular pattern (if possible)
- ❓ **Decision:** Keep hoặc remove unified wrappers

---

## ⚡ EXECUTION PLAN

### Step 1: Prompt Storage Cleanup (30 mins)

#### 1.1 Find và Remove Deprecated Methods (15 mins)
```bash
# Search for usage of deprecated methods
grep -r "getCustomPromptConfig\|saveCustomPromptConfig\|resetToDefaultPrompt\|getAICommunicationLanguage" src/
```

#### 1.2 Clean Implementation (15 mins)
- Remove deprecated method implementations
- Clean up console.warn statements  
- Update JSDoc comments
- Test build for breaking changes

### Step 2: Auth Validation Update (15 mins)

#### 2.1 Remove Deprecated Factory (10 mins)
- Remove `createAuthValidator()` function
- Clean up related utilities if unused

#### 2.2 Verify Hook Usage (5 mins)
- Check hook-based validation implementation
- Ensure no references to old factory pattern

### Step 3: Legacy Scripts Review (30 mins)

#### 3.1 Script Analysis (20 mins)
```bash
# Check each script:
- What does it do?
- Last used when?
- Still relevant post-migration?
- Any dependencies?
```

#### 3.2 Cleanup Decision (10 mins)
- Archive important but unused scripts
- Remove completely obsolete scripts
- Document remaining active scripts

### Step 4: Service Pattern Analysis (30 mins)

#### 4.1 Usage Analysis (20 mins)
```bash
# Find imports of unified services
grep -r "gemini-service-unified\|groq-service-unified" src/
```

#### 4.2 Migration or Keep Decision (10 mins)
- If low usage → Migrate to modular
- If high usage → Keep for stability
- Document decision reasoning

---

## 🧪 TESTING STRATEGY

### Build Test
```bash
npm run build
# Verify no TypeScript errors
# Check for broken imports
```

### Function Test  
- ✅ AI chat functionality (Gemini/Groq)
- ✅ Prompt loading/saving workflow
- ✅ Auth validation flow
- ✅ No console.warn in production

### Regression Test
- ✅ No breaking changes to core features
- ✅ Import/export patterns work correctly
- ✅ Production build optimized

---

## 📊 SUCCESS METRICS

### Before Cleanup:
- ❌ 10 deprecated methods với console.warn
- ❌ 2 deprecated auth patterns  
- ❌ 3+ legacy scripts status unclear
- ❌ Service pattern inconsistency

### After Cleanup:
- ✅ 0 deprecated methods
- ✅ Consistent auth validation pattern
- ✅ Clear script documentation/cleanup
- ✅ Optimized service imports

---

## ⚠️ RISK ASSESSMENT

### Low Risk:
- Prompt storage cleanup - methods already marked deprecated
- Auth validation - hook pattern already implemented

### Medium Risk:  
- Service pattern changes - may affect imports
- Legacy script removal - may break deployment scripts

### Mitigation:
- Test builds after each major change
- Keep backup of removed files temporarily
- Update documentation alongside changes

---

## 🚀 NEXT STEPS AFTER PHASE 3

Ready for **Phase 4: Performance & Code Quality**:
- Unused code removal
- Code organization  
- Performance optimization
- Bundle analysis

---

**READY TO EXECUTE PHASE 3?**
Estimated time: 1-2 hours for complete deprecated code cleanup.
