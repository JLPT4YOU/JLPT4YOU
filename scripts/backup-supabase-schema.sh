#!/bin/bash

# 🔧 SUPABASE SCHEMA & RULES BACKUP
# Backup Supabase schema, RLS policies, functions, triggers without user data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/supabase-schema-$BACKUP_DATE"
PROJECT_NAME="jlpt4you"

echo -e "${BLUE}🚀 Starting Supabase Schema Backup...${NC}"
echo -e "${BLUE}📅 Backup timestamp: $BACKUP_DATE${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p $BACKUP_DIR/schema
mkdir -p $BACKUP_DIR/policies
mkdir -p $BACKUP_DIR/functions
mkdir -p $BACKUP_DIR/triggers
mkdir -p $BACKUP_DIR/types
mkdir -p $BACKUP_DIR/extensions

echo -e "${YELLOW}📁 Created backup directory: $BACKUP_DIR${NC}"

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL and try again.${NC}"
    exit 1
fi

# 1. SCHEMA BACKUP (Tables structure only)
echo -e "${BLUE}🏗️ Backing up database schema...${NC}"

# Full schema without data
pg_dump -h localhost -U postgres -d $PROJECT_NAME \
    --schema-only \
    --no-owner \
    --no-privileges \
    > $BACKUP_DIR/schema/full-schema-$BACKUP_DATE.sql

# Individual table schemas
echo -e "${YELLOW}📋 Backing up individual table schemas...${NC}"

# Get all table names
TABLES=$(psql -h localhost -U postgres -d $PROJECT_NAME -t -c "
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'auth.%'
ORDER BY tablename;
" | tr -d ' ')

for table in $TABLES; do
    if [ ! -z "$table" ]; then
        echo -e "${YELLOW}  - Backing up table: $table${NC}"
        pg_dump -h localhost -U postgres -d $PROJECT_NAME \
            --schema-only \
            --table=$table \
            --no-owner \
            --no-privileges \
            > $BACKUP_DIR/schema/table-$table-$BACKUP_DATE.sql
    fi
done

echo -e "${GREEN}✅ Schema backup completed${NC}"

# 2. RLS POLICIES BACKUP
echo -e "${BLUE}🔒 Backing up Row Level Security policies...${NC}"

psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" > $BACKUP_DIR/policies/rls-policies-$BACKUP_DATE.txt

# Export RLS policies as SQL
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    'CREATE POLICY ' || policyname || ' ON ' || schemaname || '.' || tablename ||
    ' FOR ' || cmd ||
    CASE WHEN roles != '{public}' THEN ' TO ' || array_to_string(roles, ', ') ELSE '' END ||
    CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
    CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
    ';' as policy_sql
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" -t > $BACKUP_DIR/policies/rls-policies-create-$BACKUP_DATE.sql

echo -e "${GREEN}✅ RLS policies backup completed${NC}"

# 3. FUNCTIONS BACKUP
echo -e "${BLUE}⚙️ Backing up database functions...${NC}"

# Get all custom functions
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;
" > $BACKUP_DIR/functions/functions-list-$BACKUP_DATE.txt

# Export function definitions
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT pg_get_functiondef(p.oid) || ';'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;
" -t > $BACKUP_DIR/functions/functions-create-$BACKUP_DATE.sql

echo -e "${GREEN}✅ Functions backup completed${NC}"

# 4. TRIGGERS BACKUP
echo -e "${BLUE}⚡ Backing up triggers...${NC}"

# List all triggers
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
" > $BACKUP_DIR/triggers/triggers-list-$BACKUP_DATE.txt

# Export trigger definitions
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT pg_get_triggerdef(t.oid) || ';'
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
" -t > $BACKUP_DIR/triggers/triggers-create-$BACKUP_DATE.sql

echo -e "${GREEN}✅ Triggers backup completed${NC}"

# 5. CUSTOM TYPES BACKUP
echo -e "${BLUE}🏷️ Backing up custom types...${NC}"

# List custom types
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    n.nspname as schema_name,
    t.typname as type_name,
    t.typtype as type_type,
    pg_catalog.format_type(t.oid, NULL) as type_definition
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
AND t.typtype IN ('e', 'c', 'd')  -- enum, composite, domain
ORDER BY t.typname;
" > $BACKUP_DIR/types/custom-types-$BACKUP_DATE.txt

# Export type definitions
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    CASE 
        WHEN t.typtype = 'e' THEN 
            'CREATE TYPE ' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
            array_to_string(ARRAY(
                SELECT quote_literal(enumlabel) 
                FROM pg_enum 
                WHERE enumtypid = t.oid 
                ORDER BY enumsortorder
            ), ', ') || ');'
        ELSE 
            'CREATE TYPE ' || n.nspname || '.' || t.typname || ';'
    END as type_sql
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
AND t.typtype IN ('e', 'c', 'd')
ORDER BY t.typname;
" -t > $BACKUP_DIR/types/types-create-$BACKUP_DATE.sql

echo -e "${GREEN}✅ Custom types backup completed${NC}"

# 6. EXTENSIONS BACKUP
echo -e "${BLUE}🔌 Backing up extensions...${NC}"

psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    extname as extension_name,
    extversion as version,
    n.nspname as schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;
" > $BACKUP_DIR/extensions/extensions-$BACKUP_DATE.txt

# Create extension install script
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 'CREATE EXTENSION IF NOT EXISTS ' || extname || ';' as extension_sql
FROM pg_extension
WHERE extname NOT IN ('plpgsql')  -- Skip default extensions
ORDER BY extname;
" -t > $BACKUP_DIR/extensions/extensions-install-$BACKUP_DATE.sql

echo -e "${GREEN}✅ Extensions backup completed${NC}"

# 7. INDEXES BACKUP
echo -e "${BLUE}📊 Backing up indexes...${NC}"

psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
" > $BACKUP_DIR/schema/indexes-$BACKUP_DATE.txt

# Create index definitions
psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT indexdef || ';'
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'  -- Skip primary key indexes
ORDER BY tablename, indexname;
" -t > $BACKUP_DIR/schema/indexes-create-$BACKUP_DATE.sql

echo -e "${GREEN}✅ Indexes backup completed${NC}"

# 8. CONSTRAINTS BACKUP
echo -e "${BLUE}🔗 Backing up constraints...${NC}"

psql -h localhost -U postgres -d $PROJECT_NAME -c "
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    pg_get_constraintdef(pgc.oid) as constraint_definition
FROM information_schema.table_constraints tc
JOIN pg_constraint pgc ON tc.constraint_name = pgc.conname
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
" > $BACKUP_DIR/schema/constraints-$BACKUP_DATE.txt

echo -e "${GREEN}✅ Constraints backup completed${NC}"

# 9. CREATE RESTORATION SCRIPT
echo -e "${BLUE}📝 Creating restoration script...${NC}"

cat > $BACKUP_DIR/restore-schema.sh << EOF
#!/bin/bash

# SUPABASE SCHEMA RESTORATION SCRIPT
# Generated on: $BACKUP_DATE

set -e

echo "🔄 Restoring Supabase schema..."

# 1. Restore extensions
echo "🔌 Installing extensions..."
psql -h localhost -U postgres -d $PROJECT_NAME -f extensions/extensions-install-$BACKUP_DATE.sql

# 2. Restore custom types
echo "🏷️ Creating custom types..."
psql -h localhost -U postgres -d $PROJECT_NAME -f types/types-create-$BACKUP_DATE.sql

# 3. Restore schema
echo "🏗️ Creating tables..."
psql -h localhost -U postgres -d $PROJECT_NAME -f schema/full-schema-$BACKUP_DATE.sql

# 4. Restore functions
echo "⚙️ Creating functions..."
psql -h localhost -U postgres -d $PROJECT_NAME -f functions/functions-create-$BACKUP_DATE.sql

# 5. Restore triggers
echo "⚡ Creating triggers..."
psql -h localhost -U postgres -d $PROJECT_NAME -f triggers/triggers-create-$BACKUP_DATE.sql

# 6. Restore RLS policies
echo "🔒 Creating RLS policies..."
psql -h localhost -U postgres -d $PROJECT_NAME -f policies/rls-policies-create-$BACKUP_DATE.sql

# 7. Restore indexes
echo "📊 Creating indexes..."
psql -h localhost -U postgres -d $PROJECT_NAME -f schema/indexes-create-$BACKUP_DATE.sql

echo "✅ Schema restoration completed!"
EOF

chmod +x $BACKUP_DIR/restore-schema.sh

echo -e "${GREEN}✅ Restoration script created${NC}"

# 10. CREATE BACKUP MANIFEST
cat > $BACKUP_DIR/SUPABASE_BACKUP_MANIFEST.md << EOF
# SUPABASE SCHEMA BACKUP MANIFEST

**Backup Date:** $BACKUP_DATE
**Database:** $PROJECT_NAME
**Type:** Schema, Rules, Functions (No User Data)

## Backup Contents

### 📋 Schema
- \`schema/full-schema-$BACKUP_DATE.sql\` - Complete database schema
- \`schema/table-*-$BACKUP_DATE.sql\` - Individual table schemas
- \`schema/indexes-$BACKUP_DATE.txt\` - Index definitions
- \`schema/constraints-$BACKUP_DATE.txt\` - Constraint definitions

### 🔒 Security
- \`policies/rls-policies-$BACKUP_DATE.txt\` - RLS policies list
- \`policies/rls-policies-create-$BACKUP_DATE.sql\` - RLS creation script

### ⚙️ Functions & Triggers
- \`functions/functions-list-$BACKUP_DATE.txt\` - Functions list
- \`functions/functions-create-$BACKUP_DATE.sql\` - Function definitions
- \`triggers/triggers-list-$BACKUP_DATE.txt\` - Triggers list
- \`triggers/triggers-create-$BACKUP_DATE.sql\` - Trigger definitions

### 🏷️ Types & Extensions
- \`types/custom-types-$BACKUP_DATE.txt\` - Custom types list
- \`types/types-create-$BACKUP_DATE.sql\` - Type creation script
- \`extensions/extensions-$BACKUP_DATE.txt\` - Extensions list
- \`extensions/extensions-install-$BACKUP_DATE.sql\` - Extension install script

### 🔄 Restoration
- \`restore-schema.sh\` - Complete restoration script

## Restoration Instructions

### Full Schema Restore
\`\`\`bash
cd $BACKUP_DIR
./restore-schema.sh
\`\`\`

### Selective Restore
\`\`\`bash
# Restore only RLS policies
psql -h localhost -U postgres -d $PROJECT_NAME -f policies/rls-policies-create-$BACKUP_DATE.sql

# Restore only functions
psql -h localhost -U postgres -d $PROJECT_NAME -f functions/functions-create-$BACKUP_DATE.sql
\`\`\`

## Verification Commands

\`\`\`bash
# Check tables
psql -h localhost -U postgres -d $PROJECT_NAME -c "\\dt"

# Check RLS policies
psql -h localhost -U postgres -d $PROJECT_NAME -c "SELECT * FROM pg_policies;"

# Check functions
psql -h localhost -U postgres -d $PROJECT_NAME -c "\\df"
\`\`\`

## Notes
- This backup contains NO user data
- Only schema, rules, policies, and functions
- Safe to restore in any environment
- All sensitive data excluded

EOF

# 11. VERIFY BACKUP INTEGRITY
echo -e "${BLUE}🔍 Verifying backup integrity...${NC}"

CRITICAL_FILES=(
    "$BACKUP_DIR/schema/full-schema-$BACKUP_DATE.sql"
    "$BACKUP_DIR/policies/rls-policies-create-$BACKUP_DATE.sql"
    "$BACKUP_DIR/restore-schema.sh"
    "$BACKUP_DIR/SUPABASE_BACKUP_MANIFEST.md"
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

echo -e "${GREEN}✅ Backup integrity verified${NC}"

# 12. FINAL SUMMARY
echo -e "${BLUE}📋 Supabase Schema Backup Summary${NC}"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}🔄 Restoration script: $BACKUP_DIR/restore-schema.sh${NC}"

echo ""
echo -e "${BLUE}🔄 To restore this backup:${NC}"
echo -e "${YELLOW}cd $BACKUP_DIR && ./restore-schema.sh${NC}"

echo ""
echo -e "${GREEN}🎉 Supabase schema backup completed!${NC}"
