# ⚡ JLPT4YOU Grammar API - Quick Reference

**For**: Development Team  
**API Base URL**: `https://jlpt-vocabulary-api-6jmc.vercel.app`

---

## 🔑 Authentication
```bash
# Header (Recommended)
-H "X-API-Key: your_api_key"

# Query Parameter
?api_key=your_api_key

# User Agent (Required for user keys)
-H "User-Agent: Mozilla/5.0 (compatible; YourApp/1.0)"
```

---

## 📚 Grammar Endpoints (NEW)

### 1. Search Grammar
```bash
# Basic search
curl -H "X-API-Key: key" "/api/grammar?grammar=あまり"

# Search by meaning
curl -H "X-API-Key: key" "/api/grammar?grammar=should"

# Filter by level
curl -H "X-API-Key: key" "/api/grammar?level=n3&limit=5"

# Pagination
curl -H "X-API-Key: key" "/api/grammar?offset=10&limit=5"

# Combined filters
curl -H "X-API-Key: key" "/api/grammar?level=n2&grammar=much&limit=3"
```

### 2. Random Grammar
```bash
# Random from all levels
curl -H "X-API-Key: key" "/api/grammar/random?count=3"

# Random from specific level
curl -H "X-API-Key: key" "/api/grammar/random?level=n4&count=2"

# Single random
curl -H "X-API-Key: key" "/api/grammar/random"
```

### 3. All Grammar (Paginated)
```bash
# All grammar with pagination
curl -H "X-API-Key: key" "/api/grammar/all?limit=10"

# Specific level
curl -H "X-API-Key: key" "/api/grammar/all?level=n1&limit=20"

# Large batch
curl -H "X-API-Key: key" "/api/grammar/all?limit=100"
```

---

## 📖 Vocabulary Endpoints (Existing)

### 1. Search Vocabulary
```bash
# Search by word
curl -H "X-API-Key: key" "/api/words?word=夜更かし"

# Filter by level
curl -H "X-API-Key: key" "/api/words?level=n3&limit=10"

# Pagination
curl -H "X-API-Key: key" "/api/words?offset=20&limit=10"
```

### 2. Random Vocabulary
```bash
# Random words
curl -H "X-API-Key: key" "/api/words/random?count=5"

# Random by level
curl -H "X-API-Key: key" "/api/words/random?level=n2&count=3"
```

### 3. All Vocabulary
```bash
# All words with pagination
curl -H "X-API-Key: key" "/api/words/all?limit=50"

# Specific level
curl -H "X-API-Key: key" "/api/words/all?level=n5&limit=100"
```

---

## 🔧 Utility Endpoints

### Health Check (Public)
```bash
curl "/health"

# Response:
{
  "status": "healthy",
  "vocabulary": { "total_words": 6734, "loaded_levels": [...] },
  "grammar": { "total_grammar_points": 312, "loaded_levels": [...] }
}
```

### Statistics (Auth Required)
```bash
curl -H "X-API-Key: key" "/stats"

# Response:
{
  "vocabulary": { "total_words": 6734, "by_level": {...} },
  "grammar": { "total_grammar_points": 312, "by_level": {...} },
  "api_usage": { "remaining_requests": 9950, "rate_limit": 10000 }
}
```

### API Documentation (Public)
```bash
curl "/"
# Returns complete API documentation in JSON
```

---

## 📋 Response Formats

### Grammar Response
```json
{
  "level": "N3",
  "count": 1,
  "total": 80,
  "grammar": [
    {
      "id": 49,
      "grammar": "くらい",
      "meaning_vn": "Đến cỡ/đến mức/cỡ",
      "meaning_en": "To size/to/size",
      "structure": "A い/na な/N/V る くらい + だ/に/の",
      "level": "N3",
      "examples": [
        {
          "jp": "それは米粒くらいの大きさです。",
          "vn": "Cái đó có độ lớn cỡ như hạt gạo ấy.",
          "en": "That is as large as the grain of rice."
        }
      ]
    }
  ]
}
```

### Vocabulary Response
```json
{
  "level": "N3",
  "count": 1,
  "words": [
    {
      "Kanji": "夜更かし",
      "Hiragana": "よふかし",
      "vn": "thức khuya",
      "en": "staying up late",
      "vd": "Tôi thường xuyên thức khuya để học bài.",
      "level": "N3"
    }
  ]
}
```

---

## ⚙️ Parameters Reference

### Common Parameters
| Parameter | Type | Description | Default | Max |
|-----------|------|-------------|---------|-----|
| `level` | string | JLPT level (1-5, n1-n5) | all | - |
| `offset` | integer | Pagination start | 0 | - |
| `limit` | integer | Results per page | 50 | 200/500* |
| `count` | integer | Random items count | 1 | 50 |

*500 for `/all` endpoints, 200 for others

### Grammar-Specific Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `grammar` | string | Search pattern/meaning | `あまり`, `should` |

### Vocabulary-Specific Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `word` | string | Search kanji/hiragana/meaning | `夜更かし`, `よふかし` |

---

## 🚨 Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|---------|
| **400** | Invalid level | Wrong level format | Use 1-5 or n1-n5 |
| **401** | Invalid API key | Missing/wrong key | Check key format |
| **403** | Access denied | Domain restriction | Use allowed domain |
| **404** | Not found | Wrong endpoint | Check URL |
| **429** | Rate limit exceeded | Too many requests | Wait or upgrade key |
| **500** | Server error | Internal issue | Contact support |

---

## 📊 Rate Limits

| Key Type | Requests/Hour | Use Case |
|----------|---------------|----------|
| **Demo** | 100 | Testing only |
| **User** | 1,000 | Production apps |
| **Admin** | 10,000 | High-volume/internal |

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1692123456
```

---

## 🧪 Testing Commands

### Quick Health Check
```bash
# Test basic connectivity
curl -w "%{http_code}" -s -o /dev/null \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/health"
# Should return: 200
```

### Test All Endpoints
```bash
BASE_URL="https://jlpt-vocabulary-api-6jmc.vercel.app"
API_KEY="your_test_key"

# Vocabulary
curl -H "X-API-Key: $API_KEY" "$BASE_URL/api/words/random?count=1"

# Grammar (NEW)
curl -H "X-API-Key: $API_KEY" "$BASE_URL/api/grammar/random?count=1"

# Stats
curl -H "X-API-Key: $API_KEY" "$BASE_URL/stats"
```

### Load Testing
```bash
# Simple load test (requires 'ab' tool)
ab -n 100 -c 10 -H "X-API-Key: your_key" \
  "https://jlpt-vocabulary-api-6jmc.vercel.app/api/grammar/random"
```

---

## 🔧 Development Tools

### Local Development
```bash
# Start local server
python app.py
# API available at: http://localhost:8000

# Test locally
curl "http://localhost:8000/health"
```

### API Key Management
```bash
# Create new key
python create_website_key.py

# List all keys
python manage_keys.py list

# Check key info
curl -H "X-API-Key: your_key" "/auth/key-info"
```

---

## 📱 Integration Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://jlpt-vocabulary-api-6jmc.vercel.app';
const API_KEY = 'your_api_key';

// Get random grammar
const response = await fetch(`${API_BASE}/api/grammar/random?count=3`, {
  headers: { 'X-API-Key': API_KEY }
});
const data = await response.json();
```

### Python
```python
import requests

API_BASE = 'https://jlpt-vocabulary-api-6jmc.vercel.app'
headers = {'X-API-Key': 'your_api_key'}

# Search grammar
response = requests.get(f'{API_BASE}/api/grammar', 
                       params={'level': 'n3', 'limit': 5},
                       headers=headers)
data = response.json()
```

### cURL Scripts
```bash
#!/bin/bash
API_KEY="your_api_key"
BASE_URL="https://jlpt-vocabulary-api-6jmc.vercel.app"

# Function to call API
call_api() {
  curl -H "X-API-Key: $API_KEY" "$BASE_URL$1"
}

# Usage
call_api "/api/grammar/random?count=2"
```

---

## 🎯 Best Practices

### Performance
- ✅ Use pagination for large datasets
- ✅ Cache responses when possible
- ✅ Implement retry logic for 429 errors
- ✅ Use appropriate limits (don't over-fetch)

### Security
- ✅ Store API keys securely (environment variables)
- ✅ Never commit keys to version control
- ✅ Use HTTPS only
- ✅ Validate responses before using

### Error Handling
- ✅ Check HTTP status codes
- ✅ Parse error messages
- ✅ Implement fallback mechanisms
- ✅ Log errors for debugging

---

**🚀 Need help? Contact the team or check the full documentation!**
