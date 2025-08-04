#!/bin/bash

# 🔧 COMPLETE SUPABASE BACKUP
# Comprehensive backup of Supabase schema, configuration, and rules (NO USER DATA)

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
BACKUP_ROOT="backup/supabase-complete-$BACKUP_DATE"

echo -e "${PURPLE}🚀 COMPLETE SUPABASE BACKUP STARTING...${NC}"
echo -e "${PURPLE}📅 Backup timestamp: $BACKUP_DATE${NC}"
echo -e "${PURPLE}🎯 Target: Schema + Configuration (NO USER DATA)${NC}"

# Create main backup directory
mkdir -p $BACKUP_ROOT

echo -e "${BLUE}📁 Created main backup directory: $BACKUP_ROOT${NC}"

# 1. RUN SCHEMA BACKUP
echo -e "${BLUE}🏗️ Starting Schema & Rules Backup...${NC}"
echo -e "${YELLOW}================================================${NC}"

# Run schema backup script
if [ -f "scripts/backup-supabase-schema.sh" ]; then
    # Modify the schema backup to use our main directory
    SCHEMA_BACKUP_DIR="$BACKUP_ROOT/schema-and-rules"
    mkdir -p $SCHEMA_BACKUP_DIR
    
    # Run schema backup with custom directory
    BACKUP_DIR=$SCHEMA_BACKUP_DIR ./scripts/backup-supabase-schema.sh
    
    echo -e "${GREEN}✅ Schema backup completed${NC}"
else
    echo -e "${RED}❌ Schema backup script not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}================================================${NC}"

# 2. RUN CONFIGURATION BACKUP
echo -e "${BLUE}⚙️ Starting Configuration Backup...${NC}"
echo -e "${YELLOW}================================================${NC}"

# Run configuration backup script
if [ -f "scripts/backup-supabase-config.sh" ]; then
    # Modify the config backup to use our main directory
    CONFIG_BACKUP_DIR="$BACKUP_ROOT/configuration"
    mkdir -p $CONFIG_BACKUP_DIR
    
    # Run config backup with custom directory
    BACKUP_DIR=$CONFIG_BACKUP_DIR ./scripts/backup-supabase-config.sh
    
    echo -e "${GREEN}✅ Configuration backup completed${NC}"
else
    echo -e "${RED}❌ Configuration backup script not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}================================================${NC}"

# 3. CREATE COMPREHENSIVE MANIFEST
echo -e "${BLUE}📄 Creating comprehensive manifest...${NC}"

cat > $BACKUP_ROOT/COMPLETE_BACKUP_MANIFEST.md << EOF
# 🔧 COMPLETE SUPABASE BACKUP MANIFEST

**Backup Date:** $BACKUP_DATE  
**Backup Type:** Complete (Schema + Configuration)  
**Data Included:** NO USER DATA - Only structure and rules  
**Purpose:** Pre-authentication refactor backup  

## 📋 Backup Structure

\`\`\`
$BACKUP_ROOT/
├── schema-and-rules/           # Database schema and security
│   ├── schema/                 # Table structures, indexes, constraints
│   ├── policies/               # Row Level Security policies
│   ├── functions/              # Database functions
│   ├── triggers/               # Database triggers
│   ├── types/                  # Custom types and enums
│   ├── extensions/             # PostgreSQL extensions
│   └── restore-schema.sh       # Schema restoration script
│
├── configuration/              # Project configuration
│   ├── environment/            # Environment variables (sanitized)
│   ├── auth/                   # Authentication settings
│   ├── storage/                # Storage configuration
│   ├── api/                    # API configuration
│   ├── edge-functions/         # Edge Functions setup
│   └── verify-config.sh        # Configuration verification
│
├── COMPLETE_BACKUP_MANIFEST.md # This file
├── restore-complete.sh         # Complete restoration script
└── verify-complete.sh          # Complete verification script
\`\`\`

## 🎯 What's Included

### ✅ Database Schema
- [x] All table structures
- [x] Indexes and constraints
- [x] Custom types and enums
- [x] PostgreSQL extensions

### ✅ Security & Rules
- [x] Row Level Security (RLS) policies
- [x] Database functions
- [x] Triggers and procedures
- [x] User roles and permissions

### ✅ Project Configuration
- [x] Environment variables (structure only)
- [x] Authentication settings
- [x] Storage bucket configuration
- [x] API settings and CORS
- [x] Edge Functions setup

### ❌ What's NOT Included
- [ ] User data (users table content)
- [ ] User-generated content
- [ ] Session data
- [ ] API keys (encrypted values)
- [ ] Personal information
- [ ] Transaction history

## 🔄 Complete Restoration

### Quick Restore (Emergency)
\`\`\`bash
cd $BACKUP_ROOT
./restore-complete.sh
\`\`\`

### Step-by-Step Restore
\`\`\`bash
# 1. Restore database schema
cd schema-and-rules
./restore-schema.sh

# 2. Restore configuration
cd ../configuration
# Follow RESTORATION_GUIDE.md

# 3. Verify everything
cd ..
./verify-complete.sh
\`\`\`

## 🔍 Verification Commands

\`\`\`bash
# Verify schema restoration
psql -h localhost -U postgres -d jlpt4you -c "\\dt"

# Verify RLS policies
psql -h localhost -U postgres -d jlpt4you -c "SELECT * FROM pg_policies;"

# Verify configuration
./verify-complete.sh
\`\`\`

## 📊 Backup Statistics

- **Schema files:** $(find $BACKUP_ROOT/schema-and-rules -name "*.sql" | wc -l) SQL files
- **Policy files:** $(find $BACKUP_ROOT/schema-and-rules/policies -name "*.sql" | wc -l) policy files
- **Function files:** $(find $BACKUP_ROOT/schema-and-rules/functions -name "*.sql" | wc -l) function files
- **Config files:** $(find $BACKUP_ROOT/configuration -name "*.md" -o -name "*.txt" -o -name "*.toml" | wc -l) configuration files
- **Total size:** $(du -sh $BACKUP_ROOT | cut -f1)

## 🚨 Important Notes

### Security
- All sensitive data has been sanitized or excluded
- API keys are not included in plaintext
- User passwords and personal data excluded
- Safe to share with development team

### Compatibility
- Compatible with PostgreSQL 13+
- Requires Supabase CLI for full restoration
- Works with both local and cloud Supabase instances

### Usage
- Ideal for development environment setup
- Perfect for staging environment creation
- Safe for team collaboration
- Suitable for disaster recovery (structure only)

## 📞 Support

If you encounter issues during restoration:

1. **Check the logs** in each backup subdirectory
2. **Verify prerequisites** (PostgreSQL, Supabase CLI)
3. **Run verification scripts** to identify specific issues
4. **Consult individual restoration guides** in each subdirectory

## 🏷️ Backup Metadata

- **Created by:** Supabase Complete Backup Script
- **Script version:** 1.0
- **PostgreSQL version:** $(psql --version 2>/dev/null | head -1 || echo "Not available")
- **Supabase CLI version:** $(supabase --version 2>/dev/null || echo "Not installed")
- **Operating system:** $(uname -s)
- **Backup duration:** [Will be calculated at end]

EOF

echo -e "${GREEN}✅ Comprehensive manifest created${NC}"

# 4. CREATE COMPLETE RESTORATION SCRIPT
echo -e "${BLUE}🔄 Creating complete restoration script...${NC}"

cat > $BACKUP_ROOT/restore-complete.sh << 'EOF'
#!/bin/bash

# COMPLETE SUPABASE RESTORATION SCRIPT
# Restores both schema and configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Starting Complete Supabase Restoration...${NC}"

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client (psql) not found${NC}"
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️ Supabase CLI not found. Some features may not work.${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check completed${NC}"

# 1. Restore Schema
echo -e "${BLUE}🏗️ Restoring database schema...${NC}"
if [ -f "schema-and-rules/restore-schema.sh" ]; then
    cd schema-and-rules
    ./restore-schema.sh
    cd ..
    echo -e "${GREEN}✅ Schema restoration completed${NC}"
else
    echo -e "${RED}❌ Schema restoration script not found${NC}"
    exit 1
fi

# 2. Configuration Setup
echo -e "${BLUE}⚙️ Setting up configuration...${NC}"
if [ -f "configuration/RESTORATION_GUIDE.md" ]; then
    echo -e "${YELLOW}📖 Configuration restoration requires manual steps.${NC}"
    echo -e "${YELLOW}📖 Please follow: configuration/RESTORATION_GUIDE.md${NC}"
    echo -e "${YELLOW}📖 Then run: configuration/verify-config.sh${NC}"
else
    echo -e "${RED}❌ Configuration guide not found${NC}"
fi

# 3. Verification
echo -e "${BLUE}🔍 Running verification...${NC}"
if [ -f "verify-complete.sh" ]; then
    ./verify-complete.sh
else
    echo -e "${YELLOW}⚠️ Verification script not found${NC}"
fi

echo -e "${GREEN}🎉 Complete restoration finished!${NC}"
echo -e "${YELLOW}📖 Don't forget to complete configuration setup manually${NC}"
EOF

chmod +x $BACKUP_ROOT/restore-complete.sh

# 5. CREATE COMPLETE VERIFICATION SCRIPT
echo -e "${BLUE}🔍 Creating complete verification script...${NC}"

cat > $BACKUP_ROOT/verify-complete.sh << 'EOF'
#!/bin/bash

# COMPLETE SUPABASE VERIFICATION SCRIPT
# Verifies both schema and configuration restoration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Starting Complete Supabase Verification...${NC}"

ERRORS=0

# 1. Database Schema Verification
echo -e "${YELLOW}🏗️ Verifying database schema...${NC}"

if command -v psql &> /dev/null; then
    # Check if database exists and is accessible
    if psql -h localhost -U postgres -d jlpt4you -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        
        # Check tables
        TABLE_COUNT=$(psql -h localhost -U postgres -d jlpt4you -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$TABLE_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Tables found: $TABLE_COUNT${NC}"
        else
            echo -e "${RED}❌ No tables found${NC}"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Check RLS policies
        POLICY_COUNT=$(psql -h localhost -U postgres -d jlpt4you -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$POLICY_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ RLS policies found: $POLICY_COUNT${NC}"
        else
            echo -e "${YELLOW}⚠️ No RLS policies found${NC}"
        fi
        
        # Check functions
        FUNCTION_COUNT=$(psql -h localhost -U postgres -d jlpt4you -t -c "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';" 2>/dev/null | tr -d ' ')
        if [ "$FUNCTION_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Functions found: $FUNCTION_COUNT${NC}"
        else
            echo -e "${YELLOW}⚠️ No custom functions found${NC}"
        fi
        
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️ psql not available, skipping database verification${NC}"
fi

# 2. Configuration Verification
echo -e "${YELLOW}⚙️ Verifying configuration...${NC}"

if [ -f "configuration/verify-config.sh" ]; then
    cd configuration
    ./verify-config.sh
    cd ..
else
    echo -e "${YELLOW}⚠️ Configuration verification script not found${NC}"
fi

# 3. File Structure Verification
echo -e "${YELLOW}📁 Verifying backup structure...${NC}"

REQUIRED_DIRS=("schema-and-rules" "configuration")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ Directory found: $dir${NC}"
    else
        echo -e "${RED}❌ Directory missing: $dir${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

REQUIRED_FILES=("COMPLETE_BACKUP_MANIFEST.md" "restore-complete.sh")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ File found: $file${NC}"
    else
        echo -e "${RED}❌ File missing: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 4. Summary
echo -e "${BLUE}📊 Verification Summary${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All verifications passed!${NC}"
    echo -e "${GREEN}✅ Supabase restoration appears successful${NC}"
else
    echo -e "${RED}❌ Found $ERRORS error(s) during verification${NC}"
    echo -e "${YELLOW}📖 Please check the issues above and re-run restoration if needed${NC}"
fi

echo -e "${BLUE}📋 Next Steps:${NC}"
echo -e "${YELLOW}1. Complete manual configuration setup (see configuration/RESTORATION_GUIDE.md)${NC}"
echo -e "${YELLOW}2. Test authentication flows${NC}"
echo -e "${YELLOW}3. Verify API endpoints${NC}"
echo -e "${YELLOW}4. Test file uploads/downloads${NC}"

exit $ERRORS
EOF

chmod +x $BACKUP_ROOT/verify-complete.sh

echo -e "${GREEN}✅ Complete verification script created${NC}"

# 6. CALCULATE BACKUP DURATION AND FINALIZE
BACKUP_END_TIME=$(date +%s)
BACKUP_START_TIME=$(date -d "$BACKUP_DATE" +%s 2>/dev/null || echo $BACKUP_END_TIME)
BACKUP_DURATION=$((BACKUP_END_TIME - BACKUP_START_TIME))

# Update manifest with duration
sed -i "s/\[Will be calculated at end\]/${BACKUP_DURATION} seconds/" $BACKUP_ROOT/COMPLETE_BACKUP_MANIFEST.md 2>/dev/null || true

# 7. FINAL SUMMARY
echo -e "${PURPLE}================================================${NC}"
echo -e "${PURPLE}🎉 COMPLETE SUPABASE BACKUP FINISHED!${NC}"
echo -e "${PURPLE}================================================${NC}"

echo -e "${BLUE}📊 Backup Summary:${NC}"
echo -e "${GREEN}✅ Schema backup: Completed${NC}"
echo -e "${GREEN}✅ Configuration backup: Completed${NC}"
echo -e "${GREEN}✅ Restoration scripts: Created${NC}"
echo -e "${GREEN}✅ Verification scripts: Created${NC}"

echo -e "${YELLOW}📁 Backup location: $BACKUP_ROOT${NC}"
echo -e "${YELLOW}📖 Manifest: $BACKUP_ROOT/COMPLETE_BACKUP_MANIFEST.md${NC}"
echo -e "${YELLOW}🔄 Restore script: $BACKUP_ROOT/restore-complete.sh${NC}"
echo -e "${YELLOW}🔍 Verify script: $BACKUP_ROOT/verify-complete.sh${NC}"

echo -e "${BLUE}📊 Backup statistics:${NC}"
echo -e "${YELLOW}  - Total size: $(du -sh $BACKUP_ROOT | cut -f1)${NC}"
echo -e "${YELLOW}  - Files created: $(find $BACKUP_ROOT -type f | wc -l)${NC}"
echo -e "${YELLOW}  - Duration: ${BACKUP_DURATION} seconds${NC}"

echo ""
echo -e "${BLUE}🔄 To restore this backup:${NC}"
echo -e "${YELLOW}cd $BACKUP_ROOT && ./restore-complete.sh${NC}"

echo ""
echo -e "${BLUE}🔍 To verify restoration:${NC}"
echo -e "${YELLOW}cd $BACKUP_ROOT && ./verify-complete.sh${NC}"

echo ""
echo -e "${GREEN}🎉 Supabase backup completed successfully!${NC}"
echo -e "${PURPLE}Ready for authentication refactor! 🚀${NC}"
