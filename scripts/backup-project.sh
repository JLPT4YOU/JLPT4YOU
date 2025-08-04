#!/bin/bash

# 🔧 JLPT4YOU - COMPREHENSIVE BACKUP SCRIPT
# This script creates a complete backup of the project before authentication refactor

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/pre-auth-refactor-$BACKUP_DATE"
PROJECT_NAME="jlpt4you"

echo -e "${BLUE}🚀 Starting comprehensive backup for $PROJECT_NAME${NC}"
echo -e "${BLUE}📅 Backup timestamp: $BACKUP_DATE${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p $BACKUP_DIR/code
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/config
mkdir -p $BACKUP_DIR/logs

echo -e "${YELLOW}📁 Created backup directory: $BACKUP_DIR${NC}"

# 1. CODE BACKUP
echo -e "${BLUE}📦 Backing up source code...${NC}"

# Create git archive
git archive --format=tar.gz --prefix=$PROJECT_NAME-$BACKUP_DATE/ HEAD > $BACKUP_DIR/code/source-code-$BACKUP_DATE.tar.gz

# Create backup branch
git checkout -b backup/pre-auth-refactor-$BACKUP_DATE
git push origin backup/pre-auth-refactor-$BACKUP_DATE

# Create git tag
git tag -a v1.0-pre-auth-refactor-$BACKUP_DATE -m "Pre-authentication refactor backup - $BACKUP_DATE"
git push origin v1.0-pre-auth-refactor-$BACKUP_DATE

echo -e "${GREEN}✅ Source code backup completed${NC}"

# 2. DATABASE BACKUP
echo -e "${BLUE}🗄️ Backing up database...${NC}"

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL and try again.${NC}"
    exit 1
fi

# Full database backup
pg_dump -h localhost -U postgres -d $PROJECT_NAME > $BACKUP_DIR/database/full-backup-$BACKUP_DATE.sql

# Critical tables backup
pg_dump -h localhost -U postgres -d $PROJECT_NAME \
    -t users \
    -t user_sessions \
    -t user_api_keys \
    -t user_preferences \
    -t subscriptions \
    -t transactions \
    > $BACKUP_DIR/database/auth-tables-backup-$BACKUP_DATE.sql

# Schema only backup
pg_dump -h localhost -U postgres -d $PROJECT_NAME --schema-only > $BACKUP_DIR/database/schema-backup-$BACKUP_DATE.sql

# Export critical data as CSV
psql -h localhost -U postgres -d $PROJECT_NAME -c "
COPY (
  SELECT id, email, name, role, subscription_expires_at, created_at, updated_at 
  FROM users
) TO '$PWD/$BACKUP_DIR/database/users-export-$BACKUP_DATE.csv' WITH CSV HEADER;
"

psql -h localhost -U postgres -d $PROJECT_NAME -c "
COPY (
  SELECT user_id, provider, created_at 
  FROM user_api_keys
) TO '$PWD/$BACKUP_DIR/database/api-keys-export-$BACKUP_DATE.csv' WITH CSV HEADER;
"

echo -e "${GREEN}✅ Database backup completed${NC}"

# 3. CONFIGURATION BACKUP
echo -e "${BLUE}⚙️ Backing up configuration files...${NC}"

# Environment files
cp .env.local $BACKUP_DIR/config/.env.local.backup-$BACKUP_DATE 2>/dev/null || echo "No .env.local found"
cp .env.example $BACKUP_DIR/config/.env.example.backup-$BACKUP_DATE 2>/dev/null || echo "No .env.example found"

# Package files
cp package.json $BACKUP_DIR/config/package.json.backup-$BACKUP_DATE
cp package-lock.json $BACKUP_DIR/config/package-lock.json.backup-$BACKUP_DATE

# Configuration files
cp next.config.js $BACKUP_DIR/config/next.config.js.backup-$BACKUP_DATE
cp tailwind.config.js $BACKUP_DIR/config/tailwind.config.js.backup-$BACKUP_DATE
cp tsconfig.json $BACKUP_DIR/config/tsconfig.json.backup-$BACKUP_DATE

# Middleware and important configs
cp src/middleware.ts $BACKUP_DIR/config/middleware.ts.backup-$BACKUP_DATE
cp src/middleware/config/routes.ts $BACKUP_DIR/config/routes.ts.backup-$BACKUP_DATE

echo -e "${GREEN}✅ Configuration backup completed${NC}"

# 4. LOGS BACKUP
echo -e "${BLUE}📋 Backing up logs...${NC}"

# Application logs
if [ -d "logs" ]; then
    cp -r logs/* $BACKUP_DIR/logs/ 2>/dev/null || echo "No logs directory found"
fi

# System logs (if accessible)
if [ -f "/var/log/nginx/access.log" ]; then
    tail -n 10000 /var/log/nginx/access.log > $BACKUP_DIR/logs/nginx-access-$BACKUP_DATE.log
fi

if [ -f "/var/log/nginx/error.log" ]; then
    tail -n 10000 /var/log/nginx/error.log > $BACKUP_DIR/logs/nginx-error-$BACKUP_DATE.log
fi

echo -e "${GREEN}✅ Logs backup completed${NC}"

# 5. DEPENDENCY SNAPSHOT
echo -e "${BLUE}📚 Creating dependency snapshot...${NC}"

# NPM list
npm list --depth=0 > $BACKUP_DIR/config/npm-dependencies-$BACKUP_DATE.txt

# Node and NPM versions
echo "Node version: $(node --version)" > $BACKUP_DIR/config/versions-$BACKUP_DATE.txt
echo "NPM version: $(npm --version)" >> $BACKUP_DIR/config/versions-$BACKUP_DATE.txt
echo "OS: $(uname -a)" >> $BACKUP_DIR/config/versions-$BACKUP_DATE.txt

echo -e "${GREEN}✅ Dependency snapshot completed${NC}"

# 6. CREATE BACKUP MANIFEST
echo -e "${BLUE}📄 Creating backup manifest...${NC}"

cat > $BACKUP_DIR/BACKUP_MANIFEST.md << EOF
# JLPT4YOU Backup Manifest

**Backup Date:** $BACKUP_DATE
**Project:** $PROJECT_NAME
**Purpose:** Pre-authentication refactor backup

## Backup Contents

### 1. Source Code
- \`code/source-code-$BACKUP_DATE.tar.gz\` - Complete source code archive
- Git branch: \`backup/pre-auth-refactor-$BACKUP_DATE\`
- Git tag: \`v1.0-pre-auth-refactor-$BACKUP_DATE\`

### 2. Database
- \`database/full-backup-$BACKUP_DATE.sql\` - Complete database dump
- \`database/auth-tables-backup-$BACKUP_DATE.sql\` - Authentication tables only
- \`database/schema-backup-$BACKUP_DATE.sql\` - Database schema only
- \`database/users-export-$BACKUP_DATE.csv\` - Users data export
- \`database/api-keys-export-$BACKUP_DATE.csv\` - API keys metadata export

### 3. Configuration
- \`config/.env.local.backup-$BACKUP_DATE\` - Environment variables
- \`config/package.json.backup-$BACKUP_DATE\` - Package dependencies
- \`config/next.config.js.backup-$BACKUP_DATE\` - Next.js configuration
- \`config/middleware.ts.backup-$BACKUP_DATE\` - Current middleware
- \`config/versions-$BACKUP_DATE.txt\` - System versions

### 4. Logs
- \`logs/\` - Application and system logs

## Restoration Instructions

### Quick Restore (Emergency)
\`\`\`bash
# 1. Restore code
git checkout backup/pre-auth-refactor-$BACKUP_DATE

# 2. Restore database
psql -h localhost -U postgres -d $PROJECT_NAME < database/full-backup-$BACKUP_DATE.sql

# 3. Restore configuration
cp config/.env.local.backup-$BACKUP_DATE .env.local

# 4. Reinstall dependencies
npm ci
\`\`\`

### Selective Restore
\`\`\`bash
# Restore only authentication tables
psql -h localhost -U postgres -d $PROJECT_NAME < database/auth-tables-backup-$BACKUP_DATE.sql

# Restore only middleware
cp config/middleware.ts.backup-$BACKUP_DATE src/middleware.ts
\`\`\`

## Verification Commands

\`\`\`bash
# Verify backup integrity
tar -tzf code/source-code-$BACKUP_DATE.tar.gz | head -10

# Verify database backup
head -20 database/full-backup-$BACKUP_DATE.sql

# Check file sizes
du -sh *
\`\`\`

## Notes
- This backup was created before starting authentication system refactor
- All sensitive data (API keys) are encrypted in the database
- Environment variables may contain sensitive information
- Test restoration in staging environment before production use

EOF

echo -e "${GREEN}✅ Backup manifest created${NC}"

# 7. VERIFY BACKUP INTEGRITY
echo -e "${BLUE}🔍 Verifying backup integrity...${NC}"

# Check if all critical files exist
CRITICAL_FILES=(
    "$BACKUP_DIR/code/source-code-$BACKUP_DATE.tar.gz"
    "$BACKUP_DIR/database/full-backup-$BACKUP_DATE.sql"
    "$BACKUP_DIR/config/package.json.backup-$BACKUP_DATE"
    "$BACKUP_DIR/BACKUP_MANIFEST.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        exit 1
    fi
done

# Check file sizes
echo -e "${YELLOW}📊 Backup sizes:${NC}"
du -sh $BACKUP_DIR/*

# Create checksum file
find $BACKUP_DIR -type f -exec sha256sum {} \; > $BACKUP_DIR/checksums.txt

echo -e "${GREEN}✅ Backup integrity verified${NC}"

# 8. FINAL SUMMARY
echo -e "${BLUE}📋 Backup Summary${NC}"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}🏷️ Git tag: v1.0-pre-auth-refactor-$BACKUP_DATE${NC}"
echo -e "${YELLOW}🌿 Git branch: backup/pre-auth-refactor-$BACKUP_DATE${NC}"

echo ""
echo -e "${BLUE}🔄 To restore this backup:${NC}"
echo -e "${YELLOW}git checkout backup/pre-auth-refactor-$BACKUP_DATE${NC}"
echo -e "${YELLOW}psql -h localhost -U postgres -d $PROJECT_NAME < $BACKUP_DIR/database/full-backup-$BACKUP_DATE.sql${NC}"

echo ""
echo -e "${GREEN}🎉 Ready to proceed with authentication refactor!${NC}"
