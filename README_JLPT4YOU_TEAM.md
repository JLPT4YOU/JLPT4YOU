# 🎌 JLPT4YOU - API Integration Guide

## 📋 **Tổng quan**

Đội ngũ JLPT4YOU đã có sẵn **JLPT Vocabulary API** với **6,734 từ vựng** (N1-N5) để tích hợp vào website.

### **🔗 Thông tin API:**
- **API URL:** `https://jlpt-vocabulary-api-6jmc.vercel.app`
- **Tổng từ vựng:** 6,734 từ (N1: 1,235 | N2: 1,298 | N3: 1,384 | N4: 1,267 | N5: 1,050)
- **Bảo mật:** Domain-restricted chỉ cho jlpt4you.com
- **Rate limit:** 10,000 requests/hour

---

## 🔧 **Setup Environment Variables**

### **Đã được setup trên Vercel:**
```
NEXT_PUBLIC_JLPT_API_URL=https://jlpt-vocabulary-api-6jmc.vercel.app
NEXT_PUBLIC_JLPT_API_KEY=jlpt_web_806352_6f1eb4cc85d7fbb9
```

### **Local Development (.env.local):**
```bash
# Tạo file .env.local trong root project
NEXT_PUBLIC_JLPT_API_URL=https://jlpt-vocabulary-api-6jmc.vercel.app
NEXT_PUBLIC_JLPT_API_KEY=jlpt_web_806352_6f1eb4cc85d7fbb9
```

---

## 📱 **API Integration Code**

### **1. Tạo API Utility (utils/jlptAPI.js):**
```javascript
// utils/jlptAPI.js
const JLPT_API = {
    BASE_URL: process.env.NEXT_PUBLIC_JLPT_API_URL,
    API_KEY: process.env.NEXT_PUBLIC_JLPT_API_KEY
};

// Helper function để gọi API
async function callJLPTAPI(endpoint, params = {}) {
    try {
        const url = new URL(endpoint, JLPT_API.BASE_URL);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url, {
            headers: {
                'X-API-Key': JLPT_API.API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('JLPT API Error:', error);
        throw error;
    }
}

// Lấy từ vựng theo level
export async function getWordsByLevel(level, limit = 20, offset = 0) {
    return await callJLPTAPI('/api/words', {
        level: level,      // 'n1', 'n2', 'n3', 'n4', 'n5'
        limit: limit,      // Số từ muốn lấy (max 200)
        offset: offset     // Vị trí bắt đầu (cho pagination)
    });
}

// Tìm kiếm từ
export async function searchWords(searchTerm) {
    return await callJLPTAPI('/api/words', {
        word: searchTerm   // Có thể search kanji, hiragana, hoặc nghĩa
    });
}

// Lấy từ ngẫu nhiên
export async function getRandomWords(limit = 10, level = null) {
    const params = { limit };
    if (level) params.level = level;
    return await callJLPTAPI('/api/words/random', params);
}

// Lấy tất cả từ vựng (có pagination)
export async function getAllWords(offset = 0, limit = 50) {
    return await callJLPTAPI('/api/words/all', {
        offset: offset,
        limit: limit
    });
}

// Lấy thống kê
export async function getVocabularyStats() {
    return await callJLPTAPI('/stats');
}
```

### **2. React Component Example:**
```jsx
// components/JLPTVocabulary.jsx
import { useState, useEffect } from 'react';
import { getWordsByLevel, searchWords } from '../utils/jlptAPI';

export default function JLPTVocabulary() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState('n5');
    const [searchTerm, setSearchTerm] = useState('');

    // Load words by level
    const loadWords = async (level) => {
        setLoading(true);
        try {
            const data = await getWordsByLevel(level, 20);
            setWords(data.words);
        } catch (error) {
            console.error('Error loading words:', error);
        } finally {
            setLoading(false);
        }
    };

    // Search words
    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        
        setLoading(true);
        try {
            const data = await searchWords(searchTerm);
            setWords(data.words);
        } catch (error) {
            console.error('Error searching words:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWords(selectedLevel);
    }, [selectedLevel]);

    return (
        <div className="jlpt-vocabulary">
            {/* Level Selector */}
            <div className="level-selector">
                {['n5', 'n4', 'n3', 'n2', 'n1'].map(level => (
                    <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={selectedLevel === level ? 'active' : ''}
                    >
                        {level.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="search-box">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm từ vựng..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>Tìm kiếm</button>
            </div>

            {/* Loading */}
            {loading && <div className="loading">Đang tải...</div>}

            {/* Words List */}
            <div className="words-grid">
                {words.map((word, index) => (
                    <div key={index} className="word-card">
                        <div className="kanji">{word.Kanji}</div>
                        <div className="meaning">
                            <span className="vietnamese">{word.vn}</span>
                            <span className="english">({word.en})</span>
                        </div>
                        {word.vd && (
                            <div className="example">{word.vd}</div>
                        )}
                        <div className="level-badge">{word.level}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### **3. CSS Styling:**
```css
/* styles/jlpt-vocabulary.css */
.jlpt-vocabulary {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.level-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.level-selector button {
    padding: 10px 20px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s;
}

.level-selector button.active,
.level-selector button:hover {
    background: #007bff;
    color: white;
    border-color: #007bff;
}

.search-box {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.search-box input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
}

.search-box button {
    padding: 10px 20px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.words-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.word-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.word-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.kanji {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
}

.meaning {
    margin-bottom: 8px;
}

.vietnamese {
    color: #007bff;
    font-weight: 500;
}

.english {
    color: #666;
    margin-left: 5px;
}

.example {
    font-style: italic;
    color: #666;
    font-size: 14px;
    margin-bottom: 8px;
}

.level-badge {
    display: inline-block;
    background: #ffc107;
    color: #333;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.loading {
    text-align: center;
    padding: 20px;
    color: #666;
}
```

---

## 🎯 **Use Cases phổ biến**

### **1. Vocabulary List Page:**
```jsx
// pages/vocabulary/[level].js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { getWordsByLevel } from '../../utils/jlptAPI';

export default function VocabularyByLevel() {
    const router = useRouter();
    const { level } = router.query;
    const [words, setWords] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadWords = async (pageNum = 0) => {
        setLoading(true);
        try {
            const data = await getWordsByLevel(level, 50, pageNum * 50);
            if (pageNum === 0) {
                setWords(data.words);
            } else {
                setWords(prev => [...prev, ...data.words]);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (level) {
            loadWords(0);
            setPage(0);
        }
    }, [level]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadWords(nextPage);
    };

    return (
        <div>
            <h1>JLPT {level?.toUpperCase()} Vocabulary</h1>
            <div className="words-list">
                {words.map((word, index) => (
                    <WordCard key={index} word={word} />
                ))}
            </div>
            {!loading && (
                <button onClick={loadMore}>Load More</button>
            )}
            {loading && <div>Loading...</div>}
        </div>
    );
}
```

### **2. Random Word Quiz:**
```jsx
// components/RandomQuiz.jsx
import { useState, useEffect } from 'react';
import { getRandomWords } from '../utils/jlptAPI';

export default function RandomQuiz({ level = null }) {
    const [currentWord, setCurrentWord] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);

    const getNewWord = async () => {
        setLoading(true);
        setShowAnswer(false);
        try {
            const data = await getRandomWords(1, level);
            setCurrentWord(data.words[0]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getNewWord();
    }, [level]);

    if (loading) return <div>Loading...</div>;
    if (!currentWord) return <div>No word available</div>;

    return (
        <div className="quiz-card">
            <div className="word-display">
                <div className="kanji">{currentWord.Kanji}</div>
                {showAnswer && (
                    <div className="answer">
                        <div>{currentWord.vn}</div>
                        <div>({currentWord.en})</div>
                        {currentWord.vd && <div className="example">{currentWord.vd}</div>}
                    </div>
                )}
            </div>
            <div className="quiz-controls">
                <button onClick={() => setShowAnswer(!showAnswer)}>
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
                <button onClick={getNewWord}>Next Word</button>
            </div>
        </div>
    );
}
```

### **3. Search Functionality:**
```jsx
// components/VocabularySearch.jsx
import { useState } from 'react';
import { searchWords } from '../utils/jlptAPI';

export default function VocabularySearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await searchWords(query);
            setResults(data.words);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vocabulary-search">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by kanji, hiragana, or meaning..."
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="search-results">
                {results.length > 0 ? (
                    results.map((word, index) => (
                        <div key={index} className="result-item">
                            <strong>{word.Kanji}</strong> - {word.vn} ({word.en})
                            {word.vd && <div className="example">{word.vd}</div>}
                        </div>
                    ))
                ) : query && !loading ? (
                    <div>No results found for "{query}"</div>
                ) : null}
            </div>
        </div>
    );
}
```

---

## 📊 **API Response Format**

### **Words Response:**
```json
{
  "count": 20,
  "level": "N5",
  "limit": 20,
  "offset": 0,
  "total": 1050,
  "words": [
    {
      "Hiragana": "",
      "Kanji": "わたし",
      "en": "I",
      "level": "N5",
      "vd": "わたしはアンです。",
      "vn": "Tôi"
    }
  ]
}
```

### **Stats Response:**
```json
{
  "total_words": 6734,
  "by_level": {
    "N1": 1235,
    "N2": 1298,
    "N3": 1384,
    "N4": 1267,
    "N5": 1050
  },
  "api_version": "2.1.0"
}
```

---

## 🔒 **Security & Performance**

### **✅ Bảo mật tự động:**
- Domain-restricted: Chỉ hoạt động trên jlpt4you.com
- Rate limiting: 10,000 requests/hour
- User agent filtering: Chặn bots
- CORS protection

### **⚡ Performance Tips:**
```javascript
// Caching để tránh gọi API nhiều lần
const cache = new Map();

export async function getCachedWords(level, limit) {
    const key = `${level}-${limit}`;
    if (cache.has(key)) {
        return cache.get(key);
    }
    
    const data = await getWordsByLevel(level, limit);
    cache.set(key, data);
    return data;
}

// Debounce cho search
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query) => {
    const results = await searchWords(query);
    setSearchResults(results.words);
}, 300);
```

---

## 🚀 **Deployment Checklist**

### **✅ Đã hoàn thành:**
- ✅ API deployed tại: `https://jlpt-vocabulary-api-6jmc.vercel.app`
- ✅ Environment variables đã setup trên Vercel
- ✅ Domain restriction active cho jlpt4you.com
- ✅ 6,734 từ vựng JLPT ready

### **📋 Next Steps cho team:**
1. **Copy code examples** vào project
2. **Test API calls** trên development
3. **Implement UI components** theo design
4. **Deploy và test** trên production
5. **Monitor usage** và performance

---

## 📞 **Support**

### **API Documentation:**
- **Full docs:** https://jlpt-vocabulary-api-6jmc.vercel.app/
- **Health check:** https://jlpt-vocabulary-api-6jmc.vercel.app/health
- **Stats:** https://jlpt-vocabulary-api-6jmc.vercel.app/stats

### **GitHub Repository:**
- **Source code:** https://github.com/JLPT4YOU/jlpt-vocabulary-api

---

## 🎯 **Quick Start cho Developers**

### **1. Copy API utility:**
```bash
# Tạo file utils/jlptAPI.js và copy code từ section 1 ở trên
```

### **2. Test API ngay:**
```javascript
// Test trong browser console hoặc component
import { getWordsByLevel } from './utils/jlptAPI';

getWordsByLevel('n5', 5).then(data => {
    console.log('API working!', data.words);
});
```

### **3. Implement vào pages:**
```jsx
// Sử dụng component JLPTVocabulary từ examples trên
import JLPTVocabulary from '../components/JLPTVocabulary';

export default function VocabularyPage() {
    return (
        <div>
            <h1>JLPT Vocabulary</h1>
            <JLPTVocabulary />
        </div>
    );
}
```

---

🎌 **JLPT4YOU API** - Ready for production! 🚀

**Team có thể bắt đầu integrate ngay với code examples trên!**
