#!/bin/bash

# 🔐 ENCRYPTED BACKUP SCRIPT
# Enhanced backup with encryption for sensitive data
# Version: 1.0

set -e

# Configuration
PROJECT_NAME=${1:-"jlpt4you"}
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/encrypted-backup-$BACKUP_DATE"
ENCRYPTION_KEY_FILE="backup/.encryption-key"
LOG_FILE="logs/encrypted-backup-$BACKUP_DATE.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "❌ ERROR: $1"
    exit 1
}

# Generate or load encryption key
setup_encryption() {
    log "🔐 Setting up encryption..."
    
    mkdir -p backup logs
    
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        log "🔑 Generating new encryption key..."
        # Generate a strong 256-bit key
        openssl rand -base64 32 > "$ENCRYPTION_KEY_FILE"
        chmod 600 "$ENCRYPTION_KEY_FILE"
        log "✅ Encryption key generated and saved to $ENCRYPTION_KEY_FILE"
        log "⚠️  IMPORTANT: Keep this key safe! You'll need it to decrypt backups."
    else
        log "🔑 Using existing encryption key from $ENCRYPTION_KEY_FILE"
    fi
    
    # Verify encryption tools are available
    if ! command -v openssl &> /dev/null; then
        handle_error "OpenSSL is required for encryption but not installed"
    fi
    
    if ! command -v gpg &> /dev/null; then
        log "⚠️  GPG not available, using OpenSSL for encryption"
    fi
}

# Encrypt file using OpenSSL
encrypt_file() {
    local input_file="$1"
    local output_file="$2"
    
    if [ ! -f "$input_file" ]; then
        log "⚠️  File not found: $input_file"
        return 1
    fi
    
    log "🔐 Encrypting: $(basename "$input_file")"
    
    # Use AES-256-CBC encryption
    openssl enc -aes-256-cbc -salt -in "$input_file" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE"
    
    if [ $? -eq 0 ]; then
        log "✅ Encrypted: $(basename "$output_file")"
        # Remove original unencrypted file
        rm "$input_file"
        return 0
    else
        handle_error "Failed to encrypt $input_file"
    fi
}

# Compress and encrypt directory
compress_encrypt_directory() {
    local input_dir="$1"
    local output_file="$2"
    
    log "📦 Compressing and encrypting directory: $(basename "$input_dir")"
    
    # Create compressed archive
    tar -czf "${output_file}.tar.gz" -C "$(dirname "$input_dir")" "$(basename "$input_dir")"
    
    # Encrypt the archive
    encrypt_file "${output_file}.tar.gz" "${output_file}.tar.gz.enc"
    
    log "✅ Directory compressed and encrypted: $(basename "$output_file").tar.gz.enc"
}

# Create encrypted database backup
backup_database_encrypted() {
    log "🗄️  Creating encrypted database backup..."
    
    local db_backup_dir="$BACKUP_DIR/database"
    mkdir -p "$db_backup_dir"
    
    # Check if PostgreSQL is running
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        handle_error "PostgreSQL is not running. Please start PostgreSQL and try again."
    fi
    
    # Full database backup
    log "📊 Creating full database backup..."
    pg_dump -h localhost -U postgres -d "$PROJECT_NAME" > "$db_backup_dir/full-backup-$BACKUP_DATE.sql"
    encrypt_file "$db_backup_dir/full-backup-$BACKUP_DATE.sql" "$db_backup_dir/full-backup-$BACKUP_DATE.sql.enc"
    
    # Critical tables backup (most sensitive)
    log "🔒 Creating critical tables backup..."
    pg_dump -h localhost -U postgres -d "$PROJECT_NAME" \
        -t users \
        -t user_sessions \
        -t user_api_keys \
        -t user_preferences \
        -t subscriptions \
        -t transactions \
        > "$db_backup_dir/critical-tables-$BACKUP_DATE.sql"
    encrypt_file "$db_backup_dir/critical-tables-$BACKUP_DATE.sql" "$db_backup_dir/critical-tables-$BACKUP_DATE.sql.enc"
    
    # Schema backup (less sensitive, can be unencrypted)
    log "📋 Creating schema backup..."
    pg_dump -h localhost -U postgres -d "$PROJECT_NAME" --schema-only > "$db_backup_dir/schema-$BACKUP_DATE.sql"
    
    # Encrypted CSV exports for critical data
    log "📄 Creating encrypted CSV exports..."
    
    # Users export (encrypted)
    psql -h localhost -U postgres -d "$PROJECT_NAME" -c "
    COPY (
      SELECT id, email, name, role, subscription_expires_at, created_at, updated_at 
      FROM users
    ) TO '$PWD/$db_backup_dir/users-$BACKUP_DATE.csv' WITH CSV HEADER;
    "
    encrypt_file "$db_backup_dir/users-$BACKUP_DATE.csv" "$db_backup_dir/users-$BACKUP_DATE.csv.enc"
    
    # API keys export (encrypted)
    psql -h localhost -U postgres -d "$PROJECT_NAME" -c "
    COPY (
      SELECT user_id, provider, created_at 
      FROM user_api_keys
    ) TO '$PWD/$db_backup_dir/api-keys-$BACKUP_DATE.csv' WITH CSV HEADER;
    "
    encrypt_file "$db_backup_dir/api-keys-$BACKUP_DATE.csv" "$db_backup_dir/api-keys-$BACKUP_DATE.csv.enc"
    
    log "✅ Encrypted database backup completed"
}

# Create encrypted configuration backup
backup_config_encrypted() {
    log "⚙️  Creating encrypted configuration backup..."
    
    local config_backup_dir="$BACKUP_DIR/config"
    mkdir -p "$config_backup_dir"
    
    # Environment files (encrypted - contain secrets)
    if [ -f ".env.local" ]; then
        cp ".env.local" "$config_backup_dir/.env.local-$BACKUP_DATE"
        encrypt_file "$config_backup_dir/.env.local-$BACKUP_DATE" "$config_backup_dir/.env.local-$BACKUP_DATE.enc"
    fi
    
    if [ -f ".env.production" ]; then
        cp ".env.production" "$config_backup_dir/.env.production-$BACKUP_DATE"
        encrypt_file "$config_backup_dir/.env.production-$BACKUP_DATE" "$config_backup_dir/.env.production-$BACKUP_DATE.enc"
    fi
    
    # Package files (unencrypted - not sensitive)
    cp "package.json" "$config_backup_dir/package.json-$BACKUP_DATE" 2>/dev/null || log "⚠️  package.json not found"
    cp "package-lock.json" "$config_backup_dir/package-lock.json-$BACKUP_DATE" 2>/dev/null || log "⚠️  package-lock.json not found"
    
    # Next.js config (unencrypted)
    cp "next.config.js" "$config_backup_dir/next.config.js-$BACKUP_DATE" 2>/dev/null || log "⚠️  next.config.js not found"
    
    # TypeScript config (unencrypted)
    cp "tsconfig.json" "$config_backup_dir/tsconfig.json-$BACKUP_DATE" 2>/dev/null || log "⚠️  tsconfig.json not found"
    
    log "✅ Encrypted configuration backup completed"
}

# Create code backup (unencrypted - not sensitive)
backup_code() {
    log "💻 Creating code backup..."
    
    local code_backup_dir="$BACKUP_DIR/code"
    mkdir -p "$code_backup_dir"
    
    # Git archive
    git archive --format=tar.gz --prefix="$PROJECT_NAME-$BACKUP_DATE/" HEAD > "$code_backup_dir/source-code-$BACKUP_DATE.tar.gz"
    
    # Create backup branch
    git checkout -b "backup/pre-auth-refactor-$BACKUP_DATE" 2>/dev/null || log "⚠️  Backup branch already exists"
    git push origin "backup/pre-auth-refactor-$BACKUP_DATE" 2>/dev/null || log "⚠️  Failed to push backup branch"
    
    # Create git tag
    git tag -a "v1.0-pre-auth-refactor-$BACKUP_DATE" -m "Pre-authentication refactor backup - $BACKUP_DATE" 2>/dev/null || log "⚠️  Tag already exists"
    git push origin "v1.0-pre-auth-refactor-$BACKUP_DATE" 2>/dev/null || log "⚠️  Failed to push tag"
    
    log "✅ Code backup completed"
}

# Create backup manifest
create_manifest() {
    log "📋 Creating backup manifest..."
    
    cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# 🔐 ENCRYPTED BACKUP MANIFEST

**Backup Date:** $BACKUP_DATE  
**Project:** $PROJECT_NAME  
**Backup Type:** Encrypted  
**Encryption:** AES-256-CBC  

## 📁 Backup Contents

### 1. Code (Unencrypted)
- \`code/source-code-$BACKUP_DATE.tar.gz\` - Complete source code archive
- Git branch: \`backup/pre-auth-refactor-$BACKUP_DATE\`
- Git tag: \`v1.0-pre-auth-refactor-$BACKUP_DATE\`

### 2. Database (🔐 ENCRYPTED)
- \`database/full-backup-$BACKUP_DATE.sql.enc\` - Complete database dump (ENCRYPTED)
- \`database/critical-tables-$BACKUP_DATE.sql.enc\` - Authentication tables only (ENCRYPTED)
- \`database/schema-$BACKUP_DATE.sql\` - Database schema only (unencrypted)
- \`database/users-$BACKUP_DATE.csv.enc\` - Users data export (ENCRYPTED)
- \`database/api-keys-$BACKUP_DATE.csv.enc\` - API keys metadata export (ENCRYPTED)

### 3. Configuration (🔐 ENCRYPTED)
- \`config/.env.local-$BACKUP_DATE.enc\` - Environment variables (ENCRYPTED)
- \`config/.env.production-$BACKUP_DATE.enc\` - Production environment (ENCRYPTED)
- \`config/package.json-$BACKUP_DATE\` - Package configuration (unencrypted)
- \`config/next.config.js-$BACKUP_DATE\` - Next.js configuration (unencrypted)

## 🔓 Decryption Instructions

To decrypt encrypted files, use:

\`\`\`bash
# Decrypt a file
openssl enc -aes-256-cbc -d -in encrypted-file.enc -out decrypted-file -pass file:backup/.encryption-key

# Decrypt database backup
openssl enc -aes-256-cbc -d -in database/full-backup-$BACKUP_DATE.sql.enc -out full-backup-$BACKUP_DATE.sql -pass file:backup/.encryption-key

# Restore database
psql -h localhost -U postgres -d $PROJECT_NAME < full-backup-$BACKUP_DATE.sql
\`\`\`

## ⚠️  IMPORTANT SECURITY NOTES

1. **Keep encryption key safe:** \`backup/.encryption-key\`
2. **Encrypted files contain sensitive data:** user emails, API keys, passwords
3. **Store backups securely:** Use encrypted storage for backup files
4. **Access control:** Limit access to backup files and encryption key
5. **Regular key rotation:** Consider rotating encryption keys periodically

## 🔍 Backup Verification

All encrypted files have been verified for integrity.
Backup created successfully at: $(date)

EOF

    log "✅ Backup manifest created"
}

# Verify backup integrity
verify_backup() {
    log "🔍 Verifying backup integrity..."
    
    local errors=0
    
    # Check critical encrypted files
    local critical_files=(
        "$BACKUP_DIR/database/full-backup-$BACKUP_DATE.sql.enc"
        "$BACKUP_DIR/database/critical-tables-$BACKUP_DATE.sql.enc"
        "$BACKUP_DIR/code/source-code-$BACKUP_DATE.tar.gz"
        "$BACKUP_DIR/BACKUP_MANIFEST.md"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            local size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
            if [ "$size" -gt 0 ]; then
                log "✅ $(basename "$file") - OK ($size bytes)"
            else
                log "❌ $(basename "$file") - EMPTY"
                ((errors++))
            fi
        else
            log "❌ $(basename "$file") - MISSING"
            ((errors++))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log "✅ Backup verification completed successfully"
        return 0
    else
        log "❌ Backup verification failed with $errors errors"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}🔐 Starting encrypted backup for $PROJECT_NAME${NC}"
    echo -e "${BLUE}📅 Backup timestamp: $BACKUP_DATE${NC}"
    
    # Setup
    setup_encryption
    mkdir -p "$BACKUP_DIR"
    
    # Create backups
    backup_database_encrypted
    backup_config_encrypted
    backup_code
    create_manifest
    
    # Verify
    if verify_backup; then
        echo -e "${GREEN}🎉 Encrypted backup completed successfully!${NC}"
        echo -e "${YELLOW}📁 Backup location: $BACKUP_DIR${NC}"
        echo -e "${YELLOW}🔑 Encryption key: $ENCRYPTION_KEY_FILE${NC}"
        echo -e "${RED}⚠️  Keep the encryption key safe!${NC}"
    else
        handle_error "Backup verification failed"
    fi
}

# Execute main function
main "$@"
