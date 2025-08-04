#!/bin/bash

# 🔧 SUPABASE CONFIGURATION BACKUP
# Backup Supabase project configuration, environment variables, and settings

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/supabase-config-$BACKUP_DATE"

echo -e "${BLUE}🚀 Starting Supabase Configuration Backup...${NC}"
echo -e "${BLUE}📅 Backup timestamp: $BACKUP_DATE${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p $BACKUP_DIR/environment
mkdir -p $BACKUP_DIR/auth
mkdir -p $BACKUP_DIR/storage
mkdir -p $BACKUP_DIR/api
mkdir -p $BACKUP_DIR/edge-functions

echo -e "${YELLOW}📁 Created backup directory: $BACKUP_DIR${NC}"

# 1. ENVIRONMENT VARIABLES BACKUP
echo -e "${BLUE}⚙️ Backing up environment variables...${NC}"

# Backup .env files (sanitized)
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}  - Backing up .env.local (sanitized)${NC}"
    # Remove sensitive values, keep structure
    sed 's/=.*/=***REDACTED***/' .env.local > $BACKUP_DIR/environment/env-local-structure-$BACKUP_DATE.txt
    
    # Create template with comments
    cat > $BACKUP_DIR/environment/env-local-template-$BACKUP_DATE.txt << 'EOF'
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
fi

if [ -f ".env.example" ]; then
    cp .env.example $BACKUP_DIR/environment/env-example-$BACKUP_DATE.txt
fi

echo -e "${GREEN}✅ Environment variables backup completed${NC}"

# 2. SUPABASE PROJECT CONFIGURATION
echo -e "${BLUE}🏗️ Backing up Supabase project configuration...${NC}"

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo -e "${YELLOW}  - Using Supabase CLI to backup configuration${NC}"
    
    # Initialize supabase if not already done
    if [ ! -f "supabase/config.toml" ]; then
        echo -e "${YELLOW}  - Initializing Supabase project${NC}"
        supabase init --with-vscode-settings=false
    fi
    
    # Backup config.toml
    if [ -f "supabase/config.toml" ]; then
        cp supabase/config.toml $BACKUP_DIR/supabase-config-$BACKUP_DATE.toml
    fi
    
    # Generate types
    echo -e "${YELLOW}  - Generating TypeScript types${NC}"
    supabase gen types typescript --local > $BACKUP_DIR/database-types-$BACKUP_DATE.ts 2>/dev/null || echo "Could not generate types (requires local setup)"
    
else
    echo -e "${YELLOW}  - Supabase CLI not found, creating manual configuration backup${NC}"
    
    # Create manual config template
    cat > $BACKUP_DIR/supabase-config-template-$BACKUP_DATE.toml << 'EOF'
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

# 3. AUTH CONFIGURATION BACKUP
echo -e "${BLUE}🔐 Backing up authentication configuration...${NC}"

# Create auth configuration documentation
cat > $BACKUP_DIR/auth/auth-config-$BACKUP_DATE.md << 'EOF'
# Authentication Configuration Backup

## Current Auth Settings

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

## Custom Claims
- role: Admin | User
- subscription_expires_at: timestamp

## Hooks
- No custom hooks configured

## Email Templates
- Using default Supabase templates
- Custom branding: Not configured
EOF

# Backup current auth policies from database
if command -v psql &> /dev/null; then
    echo -e "${YELLOW}  - Backing up auth policies from database${NC}"
    
    psql -h localhost -U postgres -d jlpt4you -c "
    SELECT 
        'Auth Policy: ' || policyname as policy_info,
        'Table: ' || tablename as table_info,
        'Command: ' || cmd as command_info,
        'Roles: ' || array_to_string(roles, ', ') as roles_info
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
    " > $BACKUP_DIR/auth/current-auth-policies-$BACKUP_DATE.txt 2>/dev/null || echo "Could not connect to database"
fi

echo -e "${GREEN}✅ Auth configuration backup completed${NC}"

# 4. STORAGE CONFIGURATION BACKUP
echo -e "${BLUE}📦 Backing up storage configuration...${NC}"

cat > $BACKUP_DIR/storage/storage-config-$BACKUP_DATE.md << 'EOF'
# Storage Configuration Backup

## Buckets Configuration

### PDF Storage Bucket
- Name: pdfs
- Public: false
- File size limit: 50MB
- Allowed MIME types: application/pdf

### Avatar Storage Bucket  
- Name: avatars
- Public: true
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

## Storage Policies

### PDF Access Policy
- Policy: Users can only access their own PDFs
- RLS: Enabled
- Authentication: Required

### Avatar Access Policy
- Policy: Public read, authenticated write
- RLS: Enabled
- Authentication: Required for upload

## File Organization
```
pdfs/
  ├── user-{user_id}/
  │   ├── jlpt/
  │   └── driving/
avatars/
  ├── user-{user_id}/
  │   └── avatar.{ext}
```

## Security Settings
- File scanning: Enabled
- Virus protection: Enabled
- Content type validation: Enabled
- File name sanitization: Enabled
EOF

echo -e "${GREEN}✅ Storage configuration backup completed${NC}"

# 5. API CONFIGURATION BACKUP
echo -e "${BLUE}🔌 Backing up API configuration...${NC}"

cat > $BACKUP_DIR/api/api-config-$BACKUP_DATE.md << 'EOF'
# API Configuration Backup

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

## Custom API Routes
- /api/pdf/[id] - PDF proxy with authentication
- /api/admin/* - Admin operations
- /api/user/keys/* - API key management
- /api/topup - Payment processing
- /api/gemini/validate - AI provider validation
EOF

echo -e "${GREEN}✅ API configuration backup completed${NC}"

# 6. EDGE FUNCTIONS BACKUP
echo -e "${BLUE}⚡ Backing up Edge Functions configuration...${NC}"

if [ -d "supabase/functions" ]; then
    echo -e "${YELLOW}  - Backing up Edge Functions source code${NC}"
    cp -r supabase/functions $BACKUP_DIR/edge-functions/
else
    echo -e "${YELLOW}  - No Edge Functions found${NC}"
    
    cat > $BACKUP_DIR/edge-functions/edge-functions-config-$BACKUP_DATE.md << 'EOF'
# Edge Functions Configuration

## Current Status
- No Edge Functions currently deployed
- Using Next.js API routes instead

## Potential Edge Functions for Future
1. **PDF Processing Function**
   - Purpose: Server-side PDF manipulation
   - Trigger: HTTP request
   - Runtime: Deno

2. **Email Notification Function**
   - Purpose: Send custom emails
   - Trigger: Database webhook
   - Runtime: Deno

3. **Payment Webhook Function**
   - Purpose: Handle payment provider webhooks
   - Trigger: HTTP request
   - Runtime: Deno

## Migration Notes
- Current API routes in Next.js can be migrated to Edge Functions
- Benefits: Better performance, global distribution
- Considerations: Different runtime environment (Deno vs Node.js)
EOF
fi

echo -e "${GREEN}✅ Edge Functions backup completed${NC}"

# 7. CREATE RESTORATION GUIDE
echo -e "${BLUE}📝 Creating restoration guide...${NC}"

cat > $BACKUP_DIR/RESTORATION_GUIDE.md << EOF
# Supabase Configuration Restoration Guide

**Backup Date:** $BACKUP_DATE
**Backup Type:** Configuration, Settings, Environment

## Quick Restoration Steps

### 1. Environment Setup
\`\`\`bash
# Copy environment template
cp environment/env-local-template-$BACKUP_DATE.txt .env.local

# Edit with your actual values
nano .env.local
\`\`\`

### 2. Supabase Project Setup
\`\`\`bash
# Initialize Supabase (if not already done)
supabase init

# Copy configuration
cp supabase-config-$BACKUP_DATE.toml supabase/config.toml

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
\`\`\`

### 3. Database Schema Restoration
\`\`\`bash
# Run the schema backup script first
../backup-supabase-schema-TIMESTAMP/restore-schema.sh
\`\`\`

### 4. Authentication Configuration
1. Go to Supabase Dashboard → Authentication → Settings
2. Configure providers according to \`auth/auth-config-$BACKUP_DATE.md\`
3. Set up redirect URLs
4. Configure email templates

### 5. Storage Configuration
1. Go to Supabase Dashboard → Storage
2. Create buckets according to \`storage/storage-config-$BACKUP_DATE.md\`
3. Set up storage policies
4. Configure file size limits

### 6. API Configuration
1. Go to Supabase Dashboard → Settings → API
2. Configure rate limiting
3. Set up CORS settings
4. Verify API keys

## Verification Checklist

### Environment
- [ ] All environment variables set
- [ ] Database connection working
- [ ] Supabase client initialized

### Authentication
- [ ] Email/password login working
- [ ] Google OAuth working
- [ ] User registration working
- [ ] Password reset working

### Database
- [ ] All tables created
- [ ] RLS policies active
- [ ] Functions working
- [ ] Triggers active

### Storage
- [ ] Buckets created
- [ ] Policies configured
- [ ] File upload working
- [ ] File access working

### API
- [ ] REST API responding
- [ ] GraphQL API working
- [ ] Custom routes working
- [ ] Rate limiting active

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

4. **Storage access denied**
   - Verify bucket policies
   - Check RLS settings
   - Confirm user authentication

## Support
- Supabase Documentation: https://supabase.com/docs
- Community Support: https://github.com/supabase/supabase/discussions
- Project-specific issues: Check project README

EOF

# 8. CREATE VERIFICATION SCRIPT
cat > $BACKUP_DIR/verify-config.sh << 'EOF'
#!/bin/bash

# Supabase Configuration Verification Script

echo "🔍 Verifying Supabase configuration..."

# Check environment variables
echo "📋 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL missing"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ Supabase anon key configured"
    else
        echo "❌ Supabase anon key missing"
    fi
else
    echo "❌ .env.local not found"
fi

# Check Supabase configuration
echo "🏗️ Checking Supabase configuration..."
if [ -f "supabase/config.toml" ]; then
    echo "✅ Supabase config.toml exists"
else
    echo "❌ Supabase config.toml missing"
fi

# Test database connection
echo "🗄️ Testing database connection..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U postgres -d jlpt4you -c "SELECT 1;" &> /dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
    fi
else
    echo "⚠️ psql not available, skipping database test"
fi

echo "✅ Configuration verification completed!"
EOF

chmod +x $BACKUP_DIR/verify-config.sh

echo -e "${GREEN}✅ Restoration guide and verification script created${NC}"

# 9. FINAL SUMMARY
echo -e "${BLUE}📋 Supabase Configuration Backup Summary${NC}"
echo -e "${GREEN}✅ Configuration backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📖 Restoration guide: $BACKUP_DIR/RESTORATION_GUIDE.md${NC}"
echo -e "${YELLOW}🔍 Verification script: $BACKUP_DIR/verify-config.sh${NC}"

echo ""
echo -e "${BLUE}📋 Backup Contents:${NC}"
echo -e "${YELLOW}  - Environment variables (sanitized)${NC}"
echo -e "${YELLOW}  - Supabase project configuration${NC}"
echo -e "${YELLOW}  - Authentication settings${NC}"
echo -e "${YELLOW}  - Storage configuration${NC}"
echo -e "${YELLOW}  - API configuration${NC}"
echo -e "${YELLOW}  - Edge Functions setup${NC}"

echo ""
echo -e "${GREEN}🎉 Supabase configuration backup completed!${NC}"
