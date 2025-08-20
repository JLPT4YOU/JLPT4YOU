# 🚀 JLPT4YOU Grammar API - Deployment & Usage Guide

**For**: Technical Team & Partners  
**Version**: 2.1.0  
**Last Updated**: August 12, 2025

---

## 🏗️ Deployment Architecture

### Current Production Setup
```
GitHub Repository (Private)
    ↓ (Auto-deploy on push)
Vercel Platform
    ↓ (Serves API)
https://jlpt-vocabulary-api-6jmc.vercel.app
```

### Repository Structure
```
jlpt-vocabulary-api/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── vercel.json                     # Vercel configuration
├── security_config.py              # Security settings
├── manage_keys.py                  # API key management
├── create_website_key.py           # Key creation utility
├── README.md                       # Public documentation
├── api_documentation.html          # Interactive docs
├── grammar_api_demo.html           # Demo page
├── jlpt_n1_vocabulary_final_final.json  # N1 vocabulary
├── jlpt_n2_vocabulary_final_final.json  # N2 vocabulary
├── jlpt_n3_vocabulary_final_final.json  # N3 vocabulary
├── jlpt_n4_vocabulary_final_final.json  # N4 vocabulary
├── jlpt_n5_vocabulary_final_final.json  # N5 vocabulary
├── jlpt_n1_grammar_cleaned.json    # N1 grammar (NEW)
├── jlpt_n2_grammar_cleaned.json    # N2 grammar (NEW)
├── jlpt_n3_grammar_cleaned.json    # N3 grammar (NEW)
├── jlpt_n4_grammar_cleaned.json    # N4 grammar (NEW)
└── jlpt_n5_grammar_cleaned.json    # N5 grammar (NEW)
```

---

## 🔧 Local Development Setup

### Prerequisites
```bash
# Python 3.8+
python --version

# Git
git --version

# Vercel CLI (optional)
npm install -g vercel
```

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/JLPT4YOU/jlpt-vocabulary-api.git
cd jlpt-vocabulary-api

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run locally
python app.py

# 4. Test API
curl "http://localhost:8000/health"
```

### Local Testing Commands
```bash
# Test vocabulary (existing)
curl -H "X-API-Key: jlpt_admin_2024" \
  "http://localhost:8000/api/words/random?count=1"

# Test grammar (new)
curl -H "X-API-Key: jlpt_admin_2024" \
  "http://localhost:8000/api/grammar/random?count=1"

# Test statistics
curl -H "X-API-Key: jlpt_admin_2024" \
  "http://localhost:8000/stats"
```

---

## 🌐 Production Deployment

### Automatic Deployment (Current)
```bash
# Any push to main branch triggers auto-deploy
git add .
git commit -m "feat: your changes"
git push origin main

# Vercel automatically:
# 1. Detects changes
# 2. Builds application
# 3. Deploys to production
# 4. Updates URL
```

### Manual Deployment (If needed)
```bash
# Using Vercel CLI
vercel --prod

# Or via Vercel Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Select project: jlpt-vocabulary-api-6jmc
# 3. Click "Deploy" → "Redeploy"
```

### Environment Configuration
```json
// vercel.json
{
  "builds": [
    {
      "src": "app.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.py"
    }
  ]
}
```

---

## 🔑 API Key Management

### Creating New API Keys
```bash
# Run key creation script
python create_website_key.py

# Follow prompts:
# - Key name: "partner-app-name"
# - Rate limit: 1000 (user) or 10000 (admin)
# - Domain restrictions: "yourapp.com"
```

### Managing Existing Keys
```bash
# List all keys
python manage_keys.py list

# Update key
python manage_keys.py update <key_id>

# Disable key
python manage_keys.py disable <key_id>

# Delete key
python manage_keys.py delete <key_id>
```

### Key Types & Limits
| Type | Rate Limit | Use Case |
|------|------------|----------|
| **User** | 1,000/hour | Mobile apps, websites |
| **Admin** | 10,000/hour | Internal tools, high-volume |
| **Demo** | 100/hour | Testing, demos |

---

## 📊 Monitoring & Analytics

### Health Monitoring
```bash
# Check API health
curl "https://jlpt-vocabulary-api-6jmc.vercel.app/health"

# Expected response:
{
  "status": "healthy",
  "vocabulary": {
    "loaded_levels": ["n1", "n2", "n3", "n4", "n5"],
    "total_words": 6734
  },
  "grammar": {
    "loaded_levels": ["n1", "n2", "n3", "n4", "n5"],
    "total_grammar_points": 312
  }
}
```

### Usage Statistics
```bash
# Get detailed stats (requires API key)
curl -H "X-API-Key: jlpt_admin_2024" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/stats"
```

### Vercel Analytics
- **Dashboard**: https://vercel.com/jlpt4yous-projects/jlpt-vocabulary-api-6jmc
- **Metrics**: Response times, error rates, bandwidth usage
- **Logs**: Real-time application logs
- **Alerts**: Automatic notifications for issues

---

## 🧪 Testing Procedures

### Pre-Deployment Testing
```bash
# 1. Unit tests (local)
python -m pytest tests/ -v

# 2. Integration tests
python test_api_integration.py

# 3. Load testing
python test_load.py --requests=1000 --concurrent=50

# 4. Data validation
python validate_data.py --check-all
```

### Post-Deployment Verification
```bash
# 1. Health check
curl "https://jlpt-vocabulary-api-6jmc.vercel.app/health"

# 2. Vocabulary endpoints
curl -H "X-API-Key: test_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/api/words?level=n5&limit=1"

# 3. Grammar endpoints (NEW)
curl -H "X-API-Key: test_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/api/grammar?level=n5&limit=1"

# 4. Statistics
curl -H "X-API-Key: test_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/stats"
```

---

## 🔒 Security Considerations

### API Security
- **Authentication**: All data endpoints require API keys
- **Rate Limiting**: Per-key and per-IP limits enforced
- **CORS**: Configured for specific domains only
- **User Agent**: Validation for non-admin keys
- **Input Validation**: All parameters sanitized

### Data Security
- **Repository**: Private on GitHub
- **API Keys**: Stored securely, never in code
- **Logs**: No sensitive data logged
- **HTTPS**: All traffic encrypted

### Access Control
```python
# API key permissions
{
  "user_keys": {
    "rate_limit": 1000,
    "domain_restricted": True,
    "user_agent_required": True
  },
  "admin_keys": {
    "rate_limit": 10000,
    "domain_restricted": False,
    "user_agent_required": False
  }
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Grammar Data Not Loading
```bash
# Check if files exist
ls -la jlpt_n*_grammar_cleaned.json

# Validate JSON format
python -m json.tool jlpt_n5_grammar_cleaned.json

# Check application logs
vercel logs --app=jlpt-vocabulary-api-6jmc
```

#### 2. API Key Authentication Failing
```bash
# Verify key format
curl -H "X-API-Key: your_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/auth/key-info"

# Check rate limits
curl -H "X-API-Key: your_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/stats"
```

#### 3. Deployment Failures
```bash
# Check Vercel build logs
vercel logs --app=jlpt-vocabulary-api-6jmc --since=1h

# Verify dependencies
pip install -r requirements.txt

# Test locally first
python app.py
```

### Error Codes
| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API key | Check key format and validity |
| 429 | Rate limit exceeded | Wait or upgrade key |
| 404 | Endpoint not found | Check URL and method |
| 500 | Server error | Check logs, contact team |

---

## 📈 Performance Optimization

### Current Performance
- **Cold Start**: ~2 seconds (Vercel serverless)
- **Warm Response**: <500ms average
- **Data Loading**: ~1.5 seconds for all files
- **Memory Usage**: ~50MB per instance

### Optimization Strategies
1. **Caching**: Implement Redis for frequent queries
2. **CDN**: Use Vercel Edge for static responses
3. **Compression**: Enable gzip for large responses
4. **Pagination**: Limit default response sizes

---

## 🔄 Backup & Recovery

### Data Backup
```bash
# Backup all JSON files
tar -czf jlpt_data_backup_$(date +%Y%m%d).tar.gz *.json

# Upload to secure storage
aws s3 cp jlpt_data_backup_*.tar.gz s3://jlpt4you-backups/
```

### Recovery Procedures
1. **Repository Recovery**: GitHub maintains full history
2. **Vercel Recovery**: Previous deployments available for rollback
3. **Data Recovery**: Restore from backup files
4. **API Keys**: Regenerate if compromised

---

## 📞 Support Contacts

### Technical Issues
- **Primary**: [Tech Lead Email]
- **Secondary**: [DevOps Email]
- **Emergency**: [On-call Phone]

### Business Issues
- **Product Manager**: [PM Email]
- **Business Lead**: [Business Email]

### External Partners
- **API Support**: api-support@jlpt4you.com
- **Documentation**: docs@jlpt4you.com

---

**🎯 Remember: Always test changes locally before deploying to production!**
