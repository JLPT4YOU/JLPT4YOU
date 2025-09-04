# API Key Encryption Removal Plan

## Overview
This document outlines the plan to remove the current complex API key encryption/decryption system for Groq and Gemini API keys. The current implementation uses multiple layers of encryption that add complexity without significant security benefits.

## Current Implementation Analysis

### Files Involved in Encryption System
1. **`/src/lib/client-crypto-utils.ts`** - Client-side encryption utilities (217 lines)
2. **`/src/lib/crypto-utils.ts`** - Server-side AES-256-GCM encryption (29 lines)
3. **`/src/lib/api-key-service.ts`** - Server-side key retrieval with decryption (118 lines)
4. **`/src/app/api/user/keys/[provider]/route.ts`** - API endpoint for storing encrypted keys (160 lines)
5. **`/src/app/api/user/keys/[provider]/decrypt/route.ts`** - API endpoint for decrypting keys (70 lines)
6. **`/src/components/chat/UnifiedSettings.tsx`** - UI component using client-side encryption

### Current Encryption Flow
1. **Client-side**: User enters API key → encrypted with Web Crypto API using user-specific derived key
2. **Transport**: Encrypted key sent to server with checksum and timestamp
3. **Server-side**: Client-encrypted key is decrypted, then re-encrypted with AES-256-GCM using `APP_ENCRYPT_SECRET`
4. **Storage**: Double-encrypted key stored in `user_api_keys` table
5. **Retrieval**: Server decrypts stored key and returns plaintext to client

### Problems with Current System
- **Double encryption**: Unnecessary complexity with client + server encryption
- **Performance overhead**: Multiple encryption/decryption operations
- **Maintenance burden**: Complex crypto utilities that need security updates
- **Limited security benefit**: API keys are still transmitted as plaintext after server decryption
- **Dependency on Web Crypto API**: Compatibility issues with older browsers

## Proposed Simplified Approach

### New Flow
1. **Client-side**: User enters API key → sent directly to server (over HTTPS)
2. **Server-side**: API key stored in plaintext in `user_api_keys` table
3. **Retrieval**: Server returns plaintext API key to authenticated client

### Security Considerations
- **HTTPS encryption**: All data transmission already encrypted in transit
- **Database security**: Supabase provides enterprise-grade security for stored data
- **Authentication**: Existing JWT-based auth ensures only authorized users access their keys
- **Environment isolation**: API keys are scoped to individual user accounts

## Migration Plan

### Phase 1: Database Schema Update
- [ ] Update `user_api_keys` table to use `key_plaintext` instead of `key_encrypted`
- [ ] Create migration script to decrypt existing encrypted keys
- [ ] Ensure backward compatibility during transition

### Phase 2: API Endpoint Simplification
- [ ] Simplify `/api/user/keys/[provider]` PUT endpoint to accept plaintext keys
- [ ] Simplify `/api/user/keys/[provider]/decrypt` GET endpoint to return stored keys directly
- [ ] Remove all encryption/decryption logic from API routes

### Phase 3: Service Layer Updates
- [ ] Update `ApiKeyService` to work with plaintext keys
- [ ] Remove caching logic (no longer needed without decryption overhead)
- [ ] Update error handling for simplified flow

### Phase 4: Client-side Updates
- [ ] Update `UnifiedSettings.tsx` to send plaintext API keys
- [ ] Remove client-side encryption utilities usage
- [ ] Simplify form validation and submission logic

### Phase 5: Cleanup
- [ ] Remove unused crypto utility files
- [ ] Remove encryption-related dependencies
- [ ] Update tests to reflect simplified flow
- [ ] Update documentation

## Files to Modify

### Files to Update
1. **`/src/app/api/user/keys/[provider]/route.ts`**
   - Remove client decryption logic
   - Remove server encryption logic
   - Store API keys in plaintext

2. **`/src/app/api/user/keys/[provider]/decrypt/route.ts`**
   - Remove decryption logic
   - Return stored keys directly

3. **`/src/lib/api-key-service.ts`**
   - Remove decryption logic
   - Remove caching (no longer needed)
   - Simplify key retrieval

4. **`/src/components/chat/UnifiedSettings.tsx`**
   - Remove client-side encryption
   - Send plaintext keys to server
   - Simplify form submission logic

### Files to Remove
1. **`/src/lib/client-crypto-utils.ts`** - Client-side encryption utilities
2. **`/src/lib/crypto-utils.ts`** - Server-side encryption utilities

### Database Migration
```sql
-- Add new plaintext column
ALTER TABLE user_api_keys ADD COLUMN key_plaintext TEXT;

-- Migrate existing encrypted keys (requires manual decryption)
-- This will be handled by a migration script

-- Drop old encrypted column after migration
ALTER TABLE user_api_keys DROP COLUMN key_encrypted;
```

## Risk Assessment

### Low Risk Changes
- Client-side form updates
- API endpoint simplification
- Removing unused utility files

### Medium Risk Changes
- Database schema migration
- Service layer updates

### Mitigation Strategies
- **Gradual rollout**: Deploy changes in phases
- **Backup strategy**: Full database backup before migration
- **Rollback plan**: Keep encrypted columns until migration is verified
- **Testing**: Comprehensive testing in staging environment

## Benefits of Removal

### Performance Improvements
- **Faster API responses**: No encryption/decryption overhead
- **Reduced server load**: Simpler processing pipeline
- **Better user experience**: Faster settings save/load

### Maintenance Benefits
- **Simplified codebase**: ~400 lines of crypto code removed
- **Reduced dependencies**: Fewer security-critical libraries to maintain
- **Easier debugging**: Simpler data flow for troubleshooting

### Security Benefits
- **Reduced attack surface**: Fewer crypto implementations to secure
- **Clearer security model**: Rely on proven HTTPS + database security
- **Less complexity**: Fewer opportunities for implementation bugs

## Timeline

### Week 1: Preparation
- [ ] Create database migration scripts
- [ ] Set up staging environment for testing
- [ ] Create comprehensive test suite

### Week 2: Implementation
- [ ] Phase 1: Database schema update
- [ ] Phase 2: API endpoint updates
- [ ] Phase 3: Service layer updates

### Week 3: Frontend & Cleanup
- [ ] Phase 4: Client-side updates
- [ ] Phase 5: Cleanup and documentation
- [ ] Final testing and deployment

## Testing Strategy

### Unit Tests
- [ ] Test API endpoints with plaintext keys
- [ ] Test service layer key retrieval
- [ ] Test client-side form submission

### Integration Tests
- [ ] Test complete key save/retrieve flow
- [ ] Test authentication and authorization
- [ ] Test error handling scenarios

### User Acceptance Testing
- [ ] Test key management in settings UI
- [ ] Test AI provider functionality with new keys
- [ ] Test migration of existing users

## Rollback Plan

If issues arise during deployment:

1. **Immediate rollback**: Revert to previous deployment
2. **Database rollback**: Restore encrypted columns if needed
3. **Gradual migration**: Allow both encrypted and plaintext keys temporarily
4. **User communication**: Notify users of any required actions

## Success Criteria

- [ ] All existing API keys migrated successfully
- [ ] No degradation in AI provider functionality
- [ ] Improved performance metrics (faster settings save/load)
- [ ] Reduced codebase complexity
- [ ] No security incidents related to key storage

## Post-Deployment Monitoring

- [ ] Monitor API response times
- [ ] Track error rates for key-related operations
- [ ] Monitor user feedback on settings performance
- [ ] Verify AI provider integration continues working

---

**Note**: This plan prioritizes simplicity and maintainability while maintaining security through existing proven mechanisms (HTTPS, database security, authentication).
