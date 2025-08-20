# ⚡ JLPT4YOU API - Quick Reference

## 🔗 **API Info**
- **URL:** `https://jlpt-vocabulary-api-6jmc.vercel.app`
- **Key:** `jlpt_web_806352_6f1eb4cc85d7fbb9`
- **Words:** 6,734 (N1-N5)
- **Rate:** 10,000/hour

---

## 📱 **Essential Code**

### **API Utility (utils/jlptAPI.js):**
```javascript
const JLPT_API = {
    BASE_URL: process.env.NEXT_PUBLIC_JLPT_API_URL,
    API_KEY: process.env.NEXT_PUBLIC_JLPT_API_KEY
};

async function callAPI(endpoint, params = {}) {
    const url = new URL(endpoint, JLPT_API.BASE_URL);
    Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.append(key, params[key]);
    });

    const response = await fetch(url, {
        headers: { 'X-API-Key': JLPT_API.API_KEY }
    });
    return await response.json();
}

export const getWords = (level, limit = 20) => 
    callAPI('/api/words', { level, limit });

export const searchWords = (word) => 
    callAPI('/api/words', { word });

export const getRandomWords = (limit = 10, level = null) => 
    callAPI('/api/words/random', { limit, level });
```

### **React Component:**
```jsx
import { useState, useEffect } from 'react';
import { getWords } from '../utils/jlptAPI';

export default function VocabList({ level = 'n5' }) {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWords(level, 20)
            .then(data => setWords(data.words))
            .finally(() => setLoading(false));
    }, [level]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="vocab-list">
            {words.map((word, i) => (
                <div key={i} className="word-card">
                    <div className="kanji">{word.Kanji}</div>
                    <div className="meaning">{word.vn}</div>
                    <div className="english">({word.en})</div>
                </div>
            ))}
        </div>
    );
}
```

---

## 🎯 **Common Use Cases**

### **1. Level Selector:**
```jsx
const [level, setLevel] = useState('n5');
const levels = ['n5', 'n4', 'n3', 'n2', 'n1'];

return (
    <div>
        {levels.map(l => (
            <button 
                key={l} 
                onClick={() => setLevel(l)}
                className={level === l ? 'active' : ''}
            >
                {l.toUpperCase()}
            </button>
        ))}
        <VocabList level={level} />
    </div>
);
```

### **2. Search Box:**
```jsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

const handleSearch = async () => {
    const data = await searchWords(query);
    setResults(data.words);
};

return (
    <div>
        <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words..."
        />
        <button onClick={handleSearch}>Search</button>
        
        {results.map((word, i) => (
            <div key={i}>{word.Kanji} - {word.vn}</div>
        ))}
    </div>
);
```

### **3. Random Quiz:**
```jsx
const [word, setWord] = useState(null);
const [showAnswer, setShowAnswer] = useState(false);

const getNewWord = async () => {
    const data = await getRandomWords(1);
    setWord(data.words[0]);
    setShowAnswer(false);
};

useEffect(() => { getNewWord(); }, []);

return (
    <div className="quiz">
        {word && (
            <>
                <div className="question">{word.Kanji}</div>
                {showAnswer && (
                    <div className="answer">{word.vn}</div>
                )}
                <button onClick={() => setShowAnswer(!showAnswer)}>
                    {showAnswer ? 'Hide' : 'Show'} Answer
                </button>
                <button onClick={getNewWord}>Next</button>
            </>
        )}
    </div>
);
```

### **4. Pagination:**
```jsx
const [words, setWords] = useState([]);
const [page, setPage] = useState(0);
const [loading, setLoading] = useState(false);

const loadMore = async () => {
    setLoading(true);
    const data = await getWords('n5', 20, page * 20);
    setWords(prev => [...prev, ...data.words]);
    setPage(prev => prev + 1);
    setLoading(false);
};

return (
    <div>
        {words.map((word, i) => (
            <WordCard key={i} word={word} />
        ))}
        <button onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
        </button>
    </div>
);
```

---

## 🎨 **Quick CSS**

```css
.vocab-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    padding: 20px;
}

.word-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kanji {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
}

.meaning {
    color: #007bff;
    font-weight: 500;
    margin-bottom: 4px;
}

.english {
    color: #666;
    font-size: 14px;
}

.level-buttons button {
    padding: 8px 16px;
    margin: 0 5px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 5px;
    cursor: pointer;
}

.level-buttons button.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}
```

---

## 📊 **API Endpoints**

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/api/words?level=n5&limit=20` | Get words by level | N5 words |
| `/api/words?word=わたし` | Search specific word | Find "わたし" |
| `/api/words/random?limit=10` | Random words | Quiz mode |
| `/api/words/all?offset=0&limit=50` | All words paginated | Full list |
| `/stats` | Get statistics | Word counts |

---

## 🔧 **Environment Setup**

### **Vercel (Production):**
```
NEXT_PUBLIC_JLPT_API_URL=https://jlpt-vocabulary-api-6jmc.vercel.app
NEXT_PUBLIC_JLPT_API_KEY=jlpt_web_806352_6f1eb4cc85d7fbb9
```

### **Local (.env.local):**
```
NEXT_PUBLIC_JLPT_API_URL=https://jlpt-vocabulary-api-6jmc.vercel.app
NEXT_PUBLIC_JLPT_API_KEY=jlpt_web_806352_6f1eb4cc85d7fbb9
```

---

## ⚡ **Quick Test**

```javascript
// Test in browser console
fetch('https://jlpt-vocabulary-api-6jmc.vercel.app/api/words?level=n5&limit=3', {
    headers: { 'X-API-Key': 'jlpt_web_806352_6f1eb4cc85d7fbb9' }
})
.then(r => r.json())
.then(data => console.log('API works!', data.words));
```

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**❌ "Domain not authorized"**
- ✅ Check if running on jlpt4you.com domain
- ✅ Verify API key is correct

**❌ "API key missing"**
- ✅ Check environment variables
- ✅ Restart development server

**❌ "CORS error"**
- ✅ Ensure request from authorized domain
- ✅ Check headers are set correctly

**❌ "Rate limit exceeded"**
- ✅ Wait for rate limit reset (1 hour)
- ✅ Implement caching to reduce calls

---

## 📞 **Quick Links**

- **API Docs:** https://jlpt-vocabulary-api-6jmc.vercel.app/
- **Health Check:** https://jlpt-vocabulary-api-6jmc.vercel.app/health
- **GitHub:** https://github.com/JLPT4YOU/jlpt-vocabulary-api

---

🎌 **Ready to code!** Copy, paste, and customize! 🚀
