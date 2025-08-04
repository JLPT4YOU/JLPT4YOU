#!/bin/bash

# 🔧 SUPABASE OFFLINE BACKUP
# Backup Supabase configuration and create schema templates (NO DATABASE CONNECTION REQUIRED)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_ROOT="backup/supabase-offline-$BACKUP_DATE"

echo -e "${PURPLE}🚀 SUPABASE OFFLINE BACKUP STARTING...${NC}"
echo -e "${PURPLE}📅 Backup timestamp: $BACKUP_DATE${NC}"
echo -e "${PURPLE}🎯 Target: Configuration + Templates (NO DATABASE CONNECTION)${NC}"

# Create main backup directory
mkdir -p $BACKUP_ROOT
mkdir -p $BACKUP_ROOT/configuration
mkdir -p $BACKUP_ROOT/schema-templates
mkdir -p $BACKUP_ROOT/environment
mkdir -p $BACKUP_ROOT/auth
mkdir -p $BACKUP_ROOT/storage
mkdir -p $BACKUP_ROOT/api

echo -e "${BLUE}📁 Created backup directory: $BACKUP_ROOT${NC}"

# 1. ENVIRONMENT VARIABLES BACKUP
echo -e "${BLUE}⚙️ Backing up environment variables...${NC}"

# Backup .env files (sanitized)
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}  - Backing up .env.local (sanitized)${NC}"
    # Remove sensitive values, keep structure
    sed 's/=.*/=***REDACTED***/' .env.local > $BACKUP_ROOT/environment/env-local-structure-$BACKUP_DATE.txt
    
    # Create template with comments
    cat > $BACKUP_ROOT/environment/env-local-template-$BACKUP_DATE.txt << 'EOF'
# SUPABASE CONFIGURATION
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# DATABASE
DATABASE_URL=your_database_url_here

# ENCRYPTION
APP_ENCRYPT_SECRET=your_32_character_secret_here

# FEATURE FLAGS
NEXT_PUBLIC_USE_NEW_AUTH=false
NEXT_PUBLIC_USE_NEW_MIDDLEWARE=false
NEXT_PUBLIC_USE_NEW_API_AUTH=false

# DEVELOPMENT
NODE_ENV=development
EOF
else
    echo -e "${YELLOW}  - No .env.local found, creating template${NC}"
    cat > $BACKUP_ROOT/environment/env-local-template-$BACKUP_DATE.txt << 'EOF'
# SUPABASE CONFIGURATION TEMPLATE
# Copy this file to .env.local and fill in your values

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=your_database_url_here
APP_ENCRYPT_SECRET=your_32_character_secret_here
EOF
fi

if [ -f ".env.example" ]; then
    cp .env.example $BACKUP_ROOT/environment/env-example-$BACKUP_DATE.txt
fi

echo -e "${GREEN}✅ Environment variables backup completed${NC}"

# 2. SUPABASE PROJECT CONFIGURATION
echo -e "${BLUE}🏗️ Backing up Supabase project configuration...${NC}"

# Check if Supabase CLI is installed and config exists
if [ -f "supabase/config.toml" ]; then
    echo -e "${YELLOW}  - Found existing Supabase config${NC}"
    cp supabase/config.toml $BACKUP_ROOT/configuration/supabase-config-$BACKUP_DATE.toml
else
    echo -e "${YELLOW}  - Creating Supabase config template${NC}"
    
    cat > $BACKUP_ROOT/configuration/supabase-config-template-$BACKUP_DATE.toml << 'EOF'
# Supabase Configuration Template
# Generated from backup script

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 54324
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://your-domain.com"]
jwt_expiry = 3600
enable_signup = true
enable_confirmations = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[auth.sms]
enable_signup = false
enable_confirmations = false

[db]
port = 54322
shadow_port = 54320
major_version = 15

[storage]
enabled = true
port = 54323
file_size_limit = "50MB"
buckets = []

[edge_functions]
enabled = true
port = 54325

[analytics]
enabled = false
port = 54327
vector_port = 54328
EOF
fi

echo -e "${GREEN}✅ Supabase project configuration backup completed${NC}"

# 3. SCHEMA TEMPLATES (Based on typical JLPT4YOU structure)
echo -e "${BLUE}🏗️ Creating schema templates...${NC}"

cat > $BACKUP_ROOT/schema-templates/users-table-template.sql << 'EOF'
-- Users table template for JLPT4YOU
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_icon TEXT,
    role TEXT DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    password_updated_at TIMESTAMP WITH TIME ZONE,
    balance INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );
EOF

cat > $BACKUP_ROOT/schema-templates/user-api-keys-template.sql << 'EOF'
-- User API Keys table template
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'groq')),
    key_encrypted TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);
EOF

cat > $BACKUP_ROOT/schema-templates/common-functions-template.sql << 'EOF'
-- Common functions template for JLPT4YOU

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_api_keys table
CREATE TRIGGER update_user_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
EOF

echo -e "${GREEN}✅ Schema templates created${NC}"

# 4. AUTH CONFIGURATION DOCUMENTATION
echo -e "${BLUE}🔐 Creating auth configuration documentation...${NC}"

cat > $BACKUP_ROOT/auth/auth-config-$BACKUP_DATE.md << 'EOF'
# Authentication Configuration Documentation

## Current Auth Settings (Based on JLPT4YOU)

### Providers Enabled
- [x] Email/Password
- [x] Google OAuth
- [ ] Facebook OAuth (disabled)
- [ ] Apple OAuth (disabled)

### Email Settings
- Email confirmations: Disabled (for development)
- Double confirm changes: Enabled
- Secure email change: Enabled

### Password Settings
- Minimum password length: 6 characters
- Maximum password length: 8 characters (custom requirement)
- Password strength: Basic

### Session Settings
- JWT expiry: 3600 seconds (1 hour)
- Refresh token expiry: 30 days
- Auto refresh: Enabled

### Security Settings
- CAPTCHA: Disabled
- Rate limiting: Enabled
- Email rate limiting: Enabled

### Redirect URLs
- Site URL: http://localhost:3000 (development)
- Additional redirect URLs:
  - https://your-production-domain.com
  - https://your-staging-domain.com

### Custom Claims
- role: Admin | User
- subscription_expires_at: timestamp

### Authentication Flow
1. User registers with email/password or Google OAuth
2. Email confirmation disabled for development
3. User gets JWT token with custom claims
4. Token includes user role and subscription status
5. RLS policies enforce access control

### API Authentication
- Anon key: For public operations
- Service role key: For admin operations
- User JWT: For authenticated operations

## Migration Notes
- Current system uses custom cookie management
- New system should use Supabase SSR
- Session management needs to be simplified
- Token refresh should be automatic
EOF

echo -e "${GREEN}✅ Auth configuration documentation created${NC}"

# 5. STORAGE CONFIGURATION
echo -e "${BLUE}📦 Creating storage configuration...${NC}"

cat > $BACKUP_ROOT/storage/storage-config-$BACKUP_DATE.md << 'EOF'
# Storage Configuration for JLPT4YOU

## Buckets Configuration

### PDF Storage Bucket
- Name: pdfs
- Public: false
- File size limit: 50MB
- Allowed MIME types: application/pdf
- Path structure: user-{user_id}/category/{filename}

### Avatar Storage Bucket  
- Name: avatars
- Public: true
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp
- Path structure: user-{user_id}/avatar.{ext}

## Storage Policies Template

```sql
-- PDF bucket policies
CREATE POLICY "Users can upload PDFs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pdfs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own PDFs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pdfs' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Avatar bucket policies
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## File Organization
```
pdfs/
  ├── user-{user_id}/
  │   ├── jlpt/
  │   │   ├── n5-practice.pdf
  │   │   └── n4-grammar.pdf
  │   └── driving/
  │       └── theory-test.pdf
avatars/
  ├── user-{user_id}/
  │   └── avatar.jpg
```

## Security Settings
- File scanning: Enabled
- Virus protection: Enabled
- Content type validation: Enabled
- File name sanitization: Enabled
- Maximum file size: 50MB for PDFs, 5MB for avatars
EOF

echo -e "${GREEN}✅ Storage configuration created${NC}"

# 6. API CONFIGURATION
echo -e "${BLUE}🔌 Creating API configuration...${NC}"

cat > $BACKUP_ROOT/api/api-config-$BACKUP_DATE.md << 'EOF'
# API Configuration for JLPT4YOU

## REST API Settings
- Auto-generated REST API: Enabled
- Schema: public
- Max rows: 1000
- Enable RPC: Enabled

## GraphQL API Settings
- Auto-generated GraphQL API: Enabled
- Schema: graphql_public
- Introspection: Enabled (development only)

## API Keys
- Anon key: Public, limited permissions
- Service role key: Full access, server-side only

## Rate Limiting
- Anonymous requests: 100/hour
- Authenticated requests: 1000/hour
- Service role: Unlimited

## CORS Settings
- Allowed origins: 
  - http://localhost:3000
  - https://your-domain.com
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: authorization, content-type, x-client-info

## Custom API Routes (Next.js)
- /api/pdf/[id] - PDF proxy with authentication
- /api/admin/* - Admin operations
- /api/user/keys/* - API key management
- /api/topup - Payment processing
- /api/gemini/validate - AI provider validation
- /api/groq/validate - AI provider validation

## Authentication Patterns
- Header: Authorization: Bearer <token>
- Cookie: jlpt4you_auth_token (current, to be deprecated)
- Supabase session: Recommended approach

## Error Handling
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 429: Rate limit exceeded
- 500: Internal server error
EOF

echo -e "${GREEN}✅ API configuration created${NC}"

# 7. CREATE RESTORATION GUIDE
echo -e "${BLUE}📝 Creating restoration guide...${NC}"

cat > $BACKUP_ROOT/RESTORATION_GUIDE.md << EOF
# Supabase Offline Backup Restoration Guide

**Backup Date:** $BACKUP_DATE
**Backup Type:** Offline (Configuration + Templates)

## Prerequisites

1. **Supabase Account**: Create account at https://supabase.com
2. **Supabase CLI**: Install with \`npm install -g supabase\`
3. **PostgreSQL**: Local installation (optional for local development)
4. **Node.js**: Version 18+ for Next.js project

## Step-by-Step Restoration

### 1. Create New Supabase Project

\`\`\`bash
# Login to Supabase
supabase login

# Create new project (or use existing)
# Go to https://supabase.com/dashboard and create project
\`\`\`

### 2. Setup Local Environment

\`\`\`bash
# Initialize Supabase in your project
supabase init

# Copy configuration template
cp configuration/supabase-config-template-$BACKUP_DATE.toml supabase/config.toml

# Copy environment template
cp environment/env-local-template-$BACKUP_DATE.txt .env.local

# Edit .env.local with your actual Supabase values
nano .env.local
\`\`\`

### 3. Database Schema Setup

\`\`\`bash
# Apply schema templates
psql -h localhost -U postgres -d postgres -f schema-templates/users-table-template.sql
psql -h localhost -U postgres -d postgres -f schema-templates/user-api-keys-template.sql
psql -h localhost -U postgres -d postgres -f schema-templates/common-functions-template.sql

# Or apply to Supabase cloud database
psql "\$DATABASE_URL" -f schema-templates/users-table-template.sql
\`\`\`

### 4. Authentication Setup

1. Go to Supabase Dashboard → Authentication → Settings
2. Follow configuration in \`auth/auth-config-$BACKUP_DATE.md\`
3. Enable Google OAuth provider
4. Set redirect URLs
5. Configure email templates

### 5. Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create buckets according to \`storage/storage-config-$BACKUP_DATE.md\`
3. Apply storage policies
4. Configure file size limits

### 6. API Configuration

1. Go to Supabase Dashboard → Settings → API
2. Configure according to \`api/api-config-$BACKUP_DATE.md\`
3. Set up CORS settings
4. Configure rate limiting

## Verification Steps

### Test Database Connection
\`\`\`bash
# Test local connection
psql -h localhost -U postgres -d postgres -c "SELECT 1;"

# Test Supabase connection
psql "\$DATABASE_URL" -c "SELECT 1;"
\`\`\`

### Test Authentication
\`\`\`bash
# Start your Next.js app
npm run dev

# Test login at http://localhost:3000
\`\`\`

### Test API Endpoints
\`\`\`bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authenticated endpoint
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/user/profile
\`\`\`

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check .env.local file exists
   - Verify variable names match exactly
   - Restart development server

2. **Database connection failed**
   - Verify DATABASE_URL is correct
   - Check network connectivity
   - Confirm database is running

3. **Authentication not working**
   - Check Supabase URL and keys
   - Verify redirect URLs in dashboard
   - Check auth policies in database

## Next Steps

1. **Import existing data** (if needed)
2. **Test all features** thoroughly
3. **Update documentation** with actual values
4. **Setup monitoring** and alerts
5. **Configure backups** for production

## Support Resources

- Supabase Documentation: https://supabase.com/docs
- Community Support: https://github.com/supabase/supabase/discussions
- JLPT4YOU specific: Check project README
EOF

echo -e "${GREEN}✅ Restoration guide created${NC}"

# 8. CREATE VERIFICATION SCRIPT
cat > $BACKUP_ROOT/verify-offline-backup.sh << 'EOF'
#!/bin/bash

# Offline Backup Verification Script

echo "🔍 Verifying offline backup..."

ERRORS=0

# Check required directories
REQUIRED_DIRS=("configuration" "schema-templates" "environment" "auth" "storage" "api")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ Directory found: $dir"
    else
        echo "❌ Directory missing: $dir"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check required files
REQUIRED_FILES=("RESTORATION_GUIDE.md" "environment/env-local-template"* "schema-templates/users-table-template.sql")
for pattern in "${REQUIRED_FILES[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        echo "✅ Files found matching: $pattern"
    else
        echo "❌ Files missing matching: $pattern"
        ERRORS=$((ERRORS + 1))
    fi
done

# Summary
if [ $ERRORS -eq 0 ]; then
    echo "🎉 All verifications passed!"
    echo "✅ Offline backup appears complete"
else
    echo "❌ Found $ERRORS error(s) during verification"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Follow RESTORATION_GUIDE.md"
echo "2. Setup Supabase project"
echo "3. Apply schema templates"
echo "4. Configure authentication"

exit $ERRORS
EOF

chmod +x $BACKUP_ROOT/verify-offline-backup.sh

echo -e "${GREEN}✅ Verification script created${NC}"

# 9. FINAL SUMMARY
echo -e "${PURPLE}================================================${NC}"
echo -e "${PURPLE}🎉 SUPABASE OFFLINE BACKUP COMPLETED!${NC}"
echo -e "${PURPLE}================================================${NC}"

echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "${GREEN}✅ Configuration templates: Created${NC}"
echo -e "${GREEN}✅ Schema templates: Created${NC}"
echo -e "${GREEN}✅ Environment templates: Created${NC}"
echo -e "${GREEN}✅ Documentation: Created${NC}"
echo -e "${GREEN}✅ Restoration guide: Created${NC}"

echo -e "${YELLOW}📁 Backup location: $BACKUP_ROOT${NC}"
echo -e "${YELLOW}📖 Restoration guide: $BACKUP_ROOT/RESTORATION_GUIDE.md${NC}"
echo -e "${YELLOW}🔍 Verify script: $BACKUP_ROOT/verify-offline-backup.sh${NC}"

echo -e "${BLUE}📊 Backup statistics:${NC}"
echo -e "${YELLOW}  - Total size: $(du -sh $BACKUP_ROOT | cut -f1)${NC}"
echo -e "${YELLOW}  - Files created: $(find $BACKUP_ROOT -type f | wc -l)${NC}"

echo ""
echo -e "${BLUE}🔄 To use this backup:${NC}"
echo -e "${YELLOW}1. Read: $BACKUP_ROOT/RESTORATION_GUIDE.md${NC}"
echo -e "${YELLOW}2. Setup new Supabase project${NC}"
echo -e "${YELLOW}3. Apply templates and configuration${NC}"

echo ""
echo -e "${GREEN}🎉 Offline backup completed successfully!${NC}"
echo -e "${PURPLE}Ready for authentication refactor! 🚀${NC}"
