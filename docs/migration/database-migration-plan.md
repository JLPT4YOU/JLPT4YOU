# 🗄️ DATABASE MIGRATION PLAN - NEW AUTH SYSTEM

**Plan Date:** 2025-08-04  
**Project:** JLPT4YOU Authentication Migration  
**Phase:** Week 3 - Migration Phase  
**Target:** Enhanced database schema for modern authentication  

## 📊 **CURRENT SCHEMA ANALYSIS**

### ✅ **EXISTING STRUCTURE (Good Foundation)**
```sql
-- Current users table (database/schema.sql)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    avatar_icon TEXT,
    role user_role DEFAULT 'Free' NOT NULL,  -- ENUM: 'Free', 'Premium'
    subscription_expires_at TIMESTAMPTZ,
    password_updated_at TIMESTAMPTZ,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);
```

### 🚨 **IDENTIFIED ISSUES**

#### **1. Role System Inconsistency**
```sql
-- Current: Missing 'Admin' in enum
CREATE TYPE user_role AS ENUM ('Free', 'Premium');

-- Code expects: 'Free', 'Premium', 'Admin'
-- Need to add 'Admin' to enum
```

#### **2. Missing Authentication Tables**
- No session tracking table
- No authentication audit log
- No rate limiting storage
- No password reset tokens

#### **3. Missing Security Fields**
- No email verification status
- No login tracking (last_login_at, login_count)
- No account security flags
- No concurrent session management

#### **4. Performance Issues**
- Missing indexes for auth queries
- No partitioning for audit logs
- No cleanup policies for old sessions

---

## 🔧 **MIGRATION STRATEGY**

### **Phase 1: Schema Enhancements (Zero Downtime)**
1. Add new columns to existing tables
2. Create new authentication tables
3. Add performance indexes
4. Update RLS policies

### **Phase 2: Data Migration (Background)**
1. Populate new fields with default values
2. Migrate existing user data
3. Create initial admin users
4. Validate data integrity

### **Phase 3: Cleanup (Post-Migration)**
1. Remove deprecated columns
2. Optimize indexes
3. Update constraints
4. Final validation

---

## 📋 **DETAILED MIGRATION SCRIPTS**

### **Migration 001: Enhance Users Table**
```sql
-- File: database/migrations/003_enhance_users_for_new_auth.sql
-- Description: Add authentication-related fields to users table

-- Step 1: Add Admin role to enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Admin';

-- Step 2: Add new authentication fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'vi',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Step 3: Add constraints
ALTER TABLE public.users 
ADD CONSTRAINT IF NOT EXISTS login_count_non_negative 
    CHECK (login_count >= 0),
ADD CONSTRAINT IF NOT EXISTS failed_attempts_non_negative 
    CHECK (failed_login_attempts >= 0),
ADD CONSTRAINT IF NOT EXISTS valid_timezone 
    CHECK (timezone IS NOT NULL AND length(timezone) > 0),
ADD CONSTRAINT IF NOT EXISTS valid_locale 
    CHECK (locale IN ('vi', 'en', 'ja'));

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON public.users(account_locked);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Step 5: Update existing users with default values
UPDATE public.users 
SET 
    is_email_verified = TRUE,  -- Assume existing users are verified
    timezone = 'Asia/Ho_Chi_Minh',
    locale = 'vi'
WHERE 
    is_email_verified IS NULL 
    OR timezone IS NULL 
    OR locale IS NULL;
```

### **Migration 002: Session Tracking Table**
```sql
-- File: database/migrations/004_create_session_tracking.sql
-- Description: Create session tracking for security and audit

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}'::jsonb,
    location_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    logout_reason TEXT, -- 'manual', 'expired', 'security', 'admin'
    
    -- Constraints
    CONSTRAINT valid_session_duration 
        CHECK (expires_at > created_at),
    CONSTRAINT valid_logout_reason 
        CHECK (logout_reason IS NULL OR logout_reason IN ('manual', 'expired', 'security', 'admin'))
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);

-- Partial index for active sessions only
CREATE INDEX idx_user_sessions_active_user ON public.user_sessions(user_id, last_accessed_at) 
WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (
        user_id = auth.uid()
    );

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run daily)
-- Note: This would be handled by a cron job or scheduled function
```

### **Migration 003: Authentication Audit Log**
```sql
-- File: database/migrations/005_create_auth_audit_log.sql
-- Description: Create comprehensive authentication audit trail

CREATE TABLE IF NOT EXISTS public.auth_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL DEFAULT 'auth',
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT, -- For correlating with application logs
    error_code TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'login_attempt', 'login_success', 'login_failed',
            'logout', 'session_expired', 'session_revoked',
            'password_change', 'password_reset_request', 'password_reset_complete',
            'email_verification', 'account_locked', 'account_unlocked',
            'role_changed', 'profile_updated', 'two_factor_enabled',
            'two_factor_disabled', 'oauth_login', 'admin_action'
        )
    ),
    CONSTRAINT valid_event_category CHECK (
        event_category IN ('auth', 'security', 'admin', 'user')
    )
);

-- Partitioning by month for performance (optional, for high-volume)
-- CREATE TABLE auth_audit_log_y2025m01 PARTITION OF public.auth_audit_log
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Indexes for performance
CREATE INDEX idx_auth_audit_user_id ON public.auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_event_type ON public.auth_audit_log(event_type);
CREATE INDEX idx_auth_audit_event_category ON public.auth_audit_log(event_category);
CREATE INDEX idx_auth_audit_created_at ON public.auth_audit_log(created_at);
CREATE INDEX idx_auth_audit_success ON public.auth_audit_log(success);
CREATE INDEX idx_auth_audit_ip ON public.auth_audit_log(ip_address);

-- Composite indexes for common queries
CREATE INDEX idx_auth_audit_user_event ON public.auth_audit_log(user_id, event_type, created_at);
CREATE INDEX idx_auth_audit_failed_logins ON public.auth_audit_log(ip_address, created_at) 
WHERE event_type = 'login_failed';

-- Enable RLS
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audit log" ON public.auth_audit_log
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.auth_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_user_id UUID,
    p_session_id UUID,
    p_event_type TEXT,
    p_success BOOLEAN,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.auth_audit_log (
        user_id, session_id, event_type, success, 
        ip_address, user_agent, error_message, metadata
    ) VALUES (
        p_user_id, p_session_id, p_event_type, p_success,
        p_ip_address, p_user_agent, p_error_message, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.auth_audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Migration 004: Rate Limiting Storage**
```sql
-- File: database/migrations/006_create_rate_limiting.sql
-- Description: Create rate limiting storage for security

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address, user ID, or other identifier
    action_type TEXT NOT NULL, -- 'login', 'password_reset', 'api_call'
    attempt_count INTEGER DEFAULT 1 NOT NULL,
    window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_attempt_count CHECK (attempt_count > 0),
    CONSTRAINT valid_window CHECK (window_end > window_start),
    CONSTRAINT valid_action_type CHECK (
        action_type IN ('login', 'password_reset', 'register', 'api_call', 'admin_action')
    )
);

-- Unique constraint for active rate limit windows
CREATE UNIQUE INDEX idx_rate_limits_active ON public.rate_limits(identifier, action_type)
WHERE window_end > NOW();

-- Indexes for performance
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX idx_rate_limits_action_type ON public.rate_limits(action_type);
CREATE INDEX idx_rate_limits_window_end ON public.rate_limits(window_end);
CREATE INDEX idx_rate_limits_blocked ON public.rate_limits(is_blocked);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_action_type TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    current_window_start TIMESTAMPTZ;
    current_window_end TIMESTAMPTZ;
    current_attempts INTEGER;
    is_allowed BOOLEAN;
BEGIN
    current_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    current_window_end := NOW() + (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Get current attempt count in the window
    SELECT COALESCE(attempt_count, 0) INTO current_attempts
    FROM public.rate_limits
    WHERE identifier = p_identifier 
      AND action_type = p_action_type
      AND window_end > NOW();
    
    -- Check if allowed
    is_allowed := COALESCE(current_attempts, 0) < p_max_attempts;
    
    -- Update or insert rate limit record
    INSERT INTO public.rate_limits (
        identifier, action_type, attempt_count, 
        window_start, window_end, is_blocked
    ) VALUES (
        p_identifier, p_action_type, 1,
        current_window_start, current_window_end, NOT is_allowed
    )
    ON CONFLICT (identifier, action_type) 
    WHERE window_end > NOW()
    DO UPDATE SET
        attempt_count = rate_limits.attempt_count + 1,
        is_blocked = (rate_limits.attempt_count + 1) >= p_max_attempts,
        updated_at = NOW();
    
    RETURN is_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.rate_limits 
    WHERE window_end < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔄 **MIGRATION EXECUTION PLAN**

### **Step 1: Pre-Migration Validation**
```bash
# Backup current database
pg_dump -h localhost -U postgres jlpt4you > backup/pre-migration-$(date +%Y%m%d-%H%M%S).sql

# Validate current schema
psql -h localhost -U postgres -d jlpt4you -c "\d+ public.users"
psql -h localhost -U postgres -d jlpt4you -c "SELECT COUNT(*) FROM public.users"
```

### **Step 2: Execute Migrations**
```bash
# Run migrations in order
psql -h localhost -U postgres -d jlpt4you -f database/migrations/003_enhance_users_for_new_auth.sql
psql -h localhost -U postgres -d jlpt4you -f database/migrations/004_create_session_tracking.sql
psql -h localhost -U postgres -d jlpt4you -f database/migrations/005_create_auth_audit_log.sql
psql -h localhost -U postgres -d jlpt4you -f database/migrations/006_create_rate_limiting.sql
```

### **Step 3: Post-Migration Validation**
```bash
# Verify new tables exist
psql -h localhost -U postgres -d jlpt4you -c "\dt public.*"

# Verify new columns exist
psql -h localhost -U postgres -d jlpt4you -c "\d+ public.users"

# Verify data integrity
psql -h localhost -U postgres -d jlpt4you -c "SELECT COUNT(*) FROM public.users WHERE is_email_verified IS NOT NULL"
```

### **Step 4: Performance Testing**
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM public.users WHERE email = 'test@example.com';
EXPLAIN ANALYZE SELECT * FROM public.user_sessions WHERE user_id = 'uuid-here' AND is_active = TRUE;
EXPLAIN ANALYZE SELECT * FROM public.auth_audit_log WHERE user_id = 'uuid-here' ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 **ROLLBACK PLAN**

### **Emergency Rollback Script**
```sql
-- File: database/rollback/rollback_auth_migration.sql
-- WARNING: This will lose new authentication data

-- Drop new tables
DROP TABLE IF EXISTS public.rate_limits CASCADE;
DROP TABLE IF EXISTS public.auth_audit_log CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;

-- Remove new columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS last_login_at,
DROP COLUMN IF EXISTS login_count,
DROP COLUMN IF EXISTS is_email_verified,
DROP COLUMN IF EXISTS account_locked,
DROP COLUMN IF EXISTS failed_login_attempts,
DROP COLUMN IF EXISTS last_failed_login_at,
DROP COLUMN IF EXISTS preferences,
DROP COLUMN IF EXISTS timezone,
DROP COLUMN IF EXISTS locale,
DROP COLUMN IF EXISTS two_factor_enabled,
DROP COLUMN IF EXISTS created_by_admin;

-- Remove Admin from enum (if no admin users exist)
-- Note: This requires careful handling as it can't be done if Admin users exist
```

---

## ✅ **MIGRATION CHECKLIST**

### **Pre-Migration**
- [ ] Create comprehensive database backup
- [ ] Validate current schema structure
- [ ] Test migration scripts in staging
- [ ] Prepare rollback procedures
- [ ] Schedule maintenance window

### **During Migration**
- [ ] Execute migrations in correct order
- [ ] Validate each migration step
- [ ] Monitor database performance
- [ ] Check for any errors or warnings
- [ ] Verify data integrity

### **Post-Migration**
- [ ] Validate all new tables and columns
- [ ] Test authentication functionality
- [ ] Verify RLS policies work correctly
- [ ] Run performance tests
- [ ] Update application configuration
- [ ] Monitor system health

### **Success Criteria**
- [ ] All migrations execute without errors
- [ ] No data loss or corruption
- [ ] Authentication system works correctly
- [ ] Performance meets requirements
- [ ] Rollback procedures tested and ready

**Next Step: Implement gradual migration strategy with feature flags**
