#!/bin/bash

# 🔓 BACKUP DECRYPTION UTILITY
# Safely decrypt encrypted backup files
# Version: 1.0

set -e

# Configuration
BACKUP_DIR=${1:-""}
ENCRYPTION_KEY_FILE="backup/.encryption-key"
OUTPUT_DIR="backup/decrypted-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="logs/decrypt-backup-$(date +%Y%m%d-%H%M%S).log"

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

# Show usage
show_usage() {
    echo -e "${BLUE}🔓 BACKUP DECRYPTION UTILITY${NC}"
    echo ""
    echo "Usage: $0 <backup_directory> [options]"
    echo ""
    echo "Options:"
    echo "  -k, --key-file <file>    Specify encryption key file (default: backup/.encryption-key)"
    echo "  -o, --output <dir>       Specify output directory"
    echo "  -f, --file <file>        Decrypt specific file only"
    echo "  -v, --verify             Verify decryption without extracting"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup/encrypted-backup-20250804-123456"
    echo "  $0 backup/encrypted-backup-20250804-123456 -f database/full-backup-20250804-123456.sql.enc"
    echo "  $0 backup/encrypted-backup-20250804-123456 -v"
    echo ""
}

# Verify encryption key
verify_key() {
    if [ ! -f "$ENCRYPTION_KEY_FILE" ]; then
        handle_error "Encryption key file not found: $ENCRYPTION_KEY_FILE"
    fi
    
    # Check key file permissions
    local perms=$(stat -c "%a" "$ENCRYPTION_KEY_FILE" 2>/dev/null || stat -f "%A" "$ENCRYPTION_KEY_FILE" 2>/dev/null)
    if [ "$perms" != "600" ]; then
        log "⚠️  Warning: Encryption key file has permissive permissions ($perms)"
        log "🔒 Fixing permissions..."
        chmod 600 "$ENCRYPTION_KEY_FILE"
    fi
    
    log "✅ Encryption key verified: $ENCRYPTION_KEY_FILE"
}

# Decrypt single file
decrypt_file() {
    local encrypted_file="$1"
    local output_file="$2"
    
    if [ ! -f "$encrypted_file" ]; then
        log "❌ Encrypted file not found: $encrypted_file"
        return 1
    fi
    
    log "🔓 Decrypting: $(basename "$encrypted_file")"
    
    # Create output directory if needed
    mkdir -p "$(dirname "$output_file")"
    
    # Decrypt using OpenSSL
    if openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$output_file" -pass file:"$ENCRYPTION_KEY_FILE" 2>/dev/null; then
        log "✅ Decrypted: $(basename "$output_file")"
        
        # Verify decrypted file is not empty
        if [ -s "$output_file" ]; then
            local size=$(stat -c%s "$output_file" 2>/dev/null || stat -f%z "$output_file" 2>/dev/null)
            log "📊 File size: $size bytes"
            return 0
        else
            log "❌ Decrypted file is empty: $output_file"
            rm -f "$output_file"
            return 1
        fi
    else
        log "❌ Failed to decrypt: $(basename "$encrypted_file")"
        rm -f "$output_file"
        return 1
    fi
}

# Verify encrypted file without decrypting
verify_encrypted_file() {
    local encrypted_file="$1"
    
    log "🔍 Verifying: $(basename "$encrypted_file")"
    
    # Try to decrypt to /dev/null to verify
    if openssl enc -aes-256-cbc -d -in "$encrypted_file" -out /dev/null -pass file:"$ENCRYPTION_KEY_FILE" 2>/dev/null; then
        log "✅ Verification passed: $(basename "$encrypted_file")"
        return 0
    else
        log "❌ Verification failed: $(basename "$encrypted_file")"
        return 1
    fi
}

# Decrypt database files
decrypt_database() {
    local backup_db_dir="$BACKUP_DIR/database"
    local output_db_dir="$OUTPUT_DIR/database"
    
    if [ ! -d "$backup_db_dir" ]; then
        log "⚠️  No database directory found in backup"
        return 0
    fi
    
    log "🗄️  Decrypting database files..."
    mkdir -p "$output_db_dir"
    
    # Find and decrypt all .enc files in database directory
    find "$backup_db_dir" -name "*.enc" -type f | while read -r encrypted_file; do
        local filename=$(basename "$encrypted_file" .enc)
        local output_file="$output_db_dir/$filename"
        
        if decrypt_file "$encrypted_file" "$output_file"; then
            # Special handling for SQL files
            if [[ "$filename" == *.sql ]]; then
                log "📊 SQL file decrypted: $filename"
                # Verify SQL file is valid
                if head -1 "$output_file" | grep -q "PostgreSQL database dump\|--"; then
                    log "✅ SQL file appears valid"
                else
                    log "⚠️  SQL file may be corrupted"
                fi
            fi
        fi
    done
    
    # Copy non-encrypted files
    find "$backup_db_dir" -name "*.sql" -not -name "*.enc" -type f | while read -r sql_file; do
        cp "$sql_file" "$output_db_dir/"
        log "📋 Copied unencrypted file: $(basename "$sql_file")"
    done
    
    log "✅ Database decryption completed"
}

# Decrypt configuration files
decrypt_config() {
    local backup_config_dir="$BACKUP_DIR/config"
    local output_config_dir="$OUTPUT_DIR/config"
    
    if [ ! -d "$backup_config_dir" ]; then
        log "⚠️  No config directory found in backup"
        return 0
    fi
    
    log "⚙️  Decrypting configuration files..."
    mkdir -p "$output_config_dir"
    
    # Find and decrypt all .enc files in config directory
    find "$backup_config_dir" -name "*.enc" -type f | while read -r encrypted_file; do
        local filename=$(basename "$encrypted_file" .enc)
        local output_file="$output_config_dir/$filename"
        
        decrypt_file "$encrypted_file" "$output_file"
    done
    
    # Copy non-encrypted files
    find "$backup_config_dir" -type f -not -name "*.enc" | while read -r config_file; do
        cp "$config_file" "$output_config_dir/"
        log "📋 Copied unencrypted file: $(basename "$config_file")"
    done
    
    log "✅ Configuration decryption completed"
}

# Copy code files (not encrypted)
copy_code() {
    local backup_code_dir="$BACKUP_DIR/code"
    local output_code_dir="$OUTPUT_DIR/code"
    
    if [ ! -d "$backup_code_dir" ]; then
        log "⚠️  No code directory found in backup"
        return 0
    fi
    
    log "💻 Copying code files..."
    mkdir -p "$output_code_dir"
    
    cp -r "$backup_code_dir"/* "$output_code_dir/"
    log "✅ Code files copied"
}

# Create restoration instructions
create_restoration_guide() {
    log "📋 Creating restoration guide..."
    
    cat > "$OUTPUT_DIR/RESTORATION_GUIDE.md" << EOF
# 🔓 BACKUP RESTORATION GUIDE

**Decryption Date:** $(date)  
**Source Backup:** $BACKUP_DIR  
**Output Directory:** $OUTPUT_DIR  

## 📁 Decrypted Contents

### 1. Database Files
- \`database/full-backup-*.sql\` - Complete database dump
- \`database/critical-tables-*.sql\` - Authentication tables only
- \`database/schema-*.sql\` - Database schema only
- \`database/users-*.csv\` - Users data export
- \`database/api-keys-*.csv\` - API keys metadata export

### 2. Configuration Files
- \`config/.env.local-*\` - Environment variables
- \`config/.env.production-*\` - Production environment
- \`config/package.json-*\` - Package configuration
- \`config/next.config.js-*\` - Next.js configuration

### 3. Code Files
- \`code/source-code-*.tar.gz\` - Complete source code archive

## 🔄 Restoration Steps

### 1. Database Restoration
\`\`\`bash
# Stop application first
sudo systemctl stop jlpt4you

# Create backup of current database
pg_dump -h localhost -U postgres -d jlpt4you > current-backup-\$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
psql -h localhost -U postgres -d jlpt4you < database/full-backup-*.sql

# Verify restoration
psql -h localhost -U postgres -d jlpt4you -c "SELECT COUNT(*) FROM users;"

# Restart application
sudo systemctl start jlpt4you
\`\`\`

### 2. Configuration Restoration
\`\`\`bash
# Backup current config
cp .env.local .env.local.backup-\$(date +%Y%m%d-%H%M%S)

# Restore environment variables
cp config/.env.local-* .env.local

# Restore other configs as needed
cp config/package.json-* package.json
cp config/next.config.js-* next.config.js
\`\`\`

### 3. Code Restoration
\`\`\`bash
# Extract source code
tar -xzf code/source-code-*.tar.gz

# Or use git to restore from backup branch
git checkout backup/pre-auth-refactor-*
\`\`\`

## ⚠️  IMPORTANT NOTES

1. **Test restoration in staging first**
2. **Verify data integrity after restoration**
3. **Update dependencies if needed**
4. **Check application functionality**
5. **Monitor logs for errors**

## 🔒 Security Cleanup

After successful restoration, securely delete decrypted files:

\`\`\`bash
# Secure deletion of sensitive files
shred -vfz -n 3 database/*.sql database/*.csv config/.env.*
rm -rf $OUTPUT_DIR
\`\`\`

EOF

    log "✅ Restoration guide created: $OUTPUT_DIR/RESTORATION_GUIDE.md"
}

# Main decryption function
decrypt_backup() {
    log "🔓 Starting backup decryption..."
    log "📁 Source: $BACKUP_DIR"
    log "📁 Output: $OUTPUT_DIR"
    
    # Verify backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        handle_error "Backup directory not found: $BACKUP_DIR"
    fi
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    # Decrypt components
    decrypt_database
    decrypt_config
    copy_code
    
    # Copy manifest and other files
    if [ -f "$BACKUP_DIR/BACKUP_MANIFEST.md" ]; then
        cp "$BACKUP_DIR/BACKUP_MANIFEST.md" "$OUTPUT_DIR/"
        log "📋 Copied backup manifest"
    fi
    
    create_restoration_guide
    
    log "✅ Backup decryption completed successfully"
    log "📁 Decrypted files available in: $OUTPUT_DIR"
}

# Verify only mode
verify_backup() {
    log "🔍 Verifying encrypted backup..."
    
    local errors=0
    
    # Find all encrypted files
    find "$BACKUP_DIR" -name "*.enc" -type f | while read -r encrypted_file; do
        if verify_encrypted_file "$encrypted_file"; then
            echo "✅ $(basename "$encrypted_file")"
        else
            echo "❌ $(basename "$encrypted_file")"
            ((errors++))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log "✅ All encrypted files verified successfully"
    else
        log "❌ Verification failed for $errors files"
        exit 1
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -k|--key-file)
                ENCRYPTION_KEY_FILE="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            -f|--file)
                SINGLE_FILE="$2"
                shift 2
                ;;
            -v|--verify)
                VERIFY_ONLY=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                if [ -z "$BACKUP_DIR" ]; then
                    BACKUP_DIR="$1"
                fi
                shift
                ;;
        esac
    done
}

# Main execution
main() {
    echo -e "${BLUE}🔓 Backup Decryption Utility${NC}"
    
    # Parse arguments
    parse_args "$@"
    
    # Check if backup directory is provided
    if [ -z "$BACKUP_DIR" ]; then
        echo -e "${RED}❌ Error: Backup directory not specified${NC}"
        show_usage
        exit 1
    fi
    
    # Setup logging
    mkdir -p logs
    
    # Verify encryption key
    verify_key
    
    # Execute based on mode
    if [ "$VERIFY_ONLY" = true ]; then
        verify_backup
    elif [ -n "$SINGLE_FILE" ]; then
        # Decrypt single file
        local output_file="$OUTPUT_DIR/$(basename "$SINGLE_FILE" .enc)"
        mkdir -p "$(dirname "$output_file")"
        decrypt_file "$BACKUP_DIR/$SINGLE_FILE" "$output_file"
    else
        # Full decryption
        decrypt_backup
    fi
    
    echo -e "${GREEN}🎉 Operation completed successfully!${NC}"
}

# Execute main function with all arguments
main "$@"
