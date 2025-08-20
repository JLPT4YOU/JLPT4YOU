#!/usr/bin/env python3
"""
Proxy Server cho Google Translate API
Giải quyết vấn đề CORS và Safari blocking
"""

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import requests
import json
import urllib.parse
import time
import random

app = Flask(__name__)
CORS(app)  # Cho phép CORS từ mọi domain

class TranslateProxy:
    def __init__(self):
        self.base_url = "https://translate.googleapis.com/translate_a/single"
        self.session = requests.Session()
        
        # Danh sách User-Agent để rotate
        self.user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]
    
    def get_random_headers(self, referer=None):
        """Tạo headers ngẫu nhiên để tránh bị phát hiện"""
        headers = {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8,ja;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
        }
        
        if referer:
            headers['Referer'] = referer
            headers['Origin'] = referer.rstrip('/')
        
        return headers
    
    def translate(self, text, source_lang='auto', target_lang='vi', method='mazii'):
        """Dịch văn bản sử dụng Google Translate API"""
        
        if method == 'jdict':
            params = {
                'client': 'gtx',
                'sl': source_lang,
                'tl': target_lang,
                'dt': ['t', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 'at'],
                'dj': '1',
                'q': text
            }
            referer = 'https://jdict.net/'
        else:  # mazii method
            params = {
                'client': 'gtx',
                'sl': source_lang,
                'tl': target_lang,
                'dt': 't',
                'q': text
            }
            referer = 'https://mazii.net/'
        
        try:
            headers = self.get_random_headers(referer)
            
            response = self.session.get(
                self.base_url, 
                params=params, 
                headers=headers, 
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            
            if method == 'jdict':
                translated_text = data.get('sentences', [{}])[0].get('trans', '')
                source_detected = data.get('src', source_lang)
                confidence = data.get('confidence', 0)
            else:  # mazii method
                translated_text = ''
                if data and len(data) > 0 and data[0] and len(data[0]) > 0:
                    translated_text = data[0][0][0]
                source_detected = data[2] if len(data) > 2 else source_lang
                confidence = 1.0
            
            return {
                'success': True,
                'translated_text': translated_text,
                'source_language': source_detected,
                'target_language': target_lang,
                'confidence': confidence,
                'method': method,
                'original_text': text
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'method': method,
                'original_text': text
            }

# Khởi tạo proxy
proxy = TranslateProxy()

@app.route('/')
def index():
    """Trang chủ với giao diện test"""
    html_template = """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Translate Proxy Server</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            input, textarea, select, button { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; }
            button { background: #007bff; color: white; cursor: pointer; }
            button:hover { background: #0056b3; }
            .result { background: white; padding: 15px; border-radius: 5px; margin-top: 10px; }
            .error { background: #f8d7da; color: #721c24; }
            .success { background: #d4edda; color: #155724; }
        </style>
    </head>
    <body>
        <h1>🚀 Google Translate Proxy Server</h1>
        <p>Giải quyết vấn đề CORS và Safari blocking</p>
        
        <div class="container">
            <h3>Test Translation</h3>
            <textarea id="sourceText" placeholder="Nhập văn bản cần dịch...">こんにちは</textarea>
            
            <select id="sourceLang">
                <option value="auto">Tự động</option>
                <option value="ja" selected>Tiếng Nhật</option>
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
            </select>
            
            <select id="targetLang">
                <option value="vi" selected>Tiếng Việt</option>
                <option value="ja">Tiếng Nhật</option>
                <option value="en">Tiếng Anh</option>
            </select>
            
            <select id="method">
                <option value="mazii" selected>Mazii Method</option>
                <option value="jdict">JDict Method</option>
            </select>
            
            <button onclick="translateText()">Dịch</button>
            
            <div id="result"></div>
        </div>
        
        <div class="container">
            <h3>API Endpoints</h3>
            <p><strong>POST /translate</strong> - Dịch văn bản</p>
            <p><strong>GET /health</strong> - Kiểm tra trạng thái server</p>
            
            <h4>Ví dụ sử dụng:</h4>
            <pre>
curl -X POST http://localhost:5000/translate \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "こんにちは",
    "source_lang": "ja",
    "target_lang": "vi",
    "method": "mazii"
  }'
            </pre>
        </div>
        
        <script>
            async function translateText() {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = '<div class="result">🔄 Đang dịch...</div>';
                
                try {
                    const response = await fetch('/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            text: document.getElementById('sourceText').value,
                            source_lang: document.getElementById('sourceLang').value,
                            target_lang: document.getElementById('targetLang').value,
                            method: document.getElementById('method').value
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = `
                            <div class="result success">
                                <strong>✅ Kết quả:</strong> ${data.translated_text}<br>
                                <strong>Ngôn ngữ phát hiện:</strong> ${data.source_language}<br>
                                <strong>Độ tin cậy:</strong> ${data.confidence}<br>
                                <strong>Phương pháp:</strong> ${data.method}
                            </div>
                        `;
                    } else {
                        resultDiv.innerHTML = `
                            <div class="result error">
                                <strong>❌ Lỗi:</strong> ${data.error}
                            </div>
                        `;
                    }
                } catch (error) {
                    resultDiv.innerHTML = `
                        <div class="result error">
                            <strong>❌ Lỗi kết nối:</strong> ${error.message}
                        </div>
                    `;
                }
            }
        </script>
    </body>
    </html>
    """
    return render_template_string(html_template)

@app.route('/translate', methods=['POST'])
def translate_api():
    """API endpoint để dịch văn bản"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        source_lang = data.get('source_lang', 'auto')
        target_lang = data.get('target_lang', 'vi')
        method = data.get('method', 'mazii')
        
        # Thêm delay ngẫu nhiên để tránh rate limiting
        time.sleep(random.uniform(0.1, 0.5))
        
        result = proxy.translate(text, source_lang, target_lang, method)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Kiểm tra trạng thái server"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'message': 'Google Translate Proxy Server is running'
    })

@app.route('/test-safari', methods=['GET'])
def test_safari():
    """Test tương thích Safari"""
    user_agent = request.headers.get('User-Agent', '')
    is_safari = 'Safari' in user_agent and 'Chrome' not in user_agent
    
    return jsonify({
        'is_safari': is_safari,
        'user_agent': user_agent,
        'headers': dict(request.headers),
        'message': 'Safari compatibility test'
    })

if __name__ == '__main__':
    print("🚀 Starting Google Translate Proxy Server...")
    print("📍 Server will be available at: http://localhost:8080")
    print("🔧 API endpoint: http://localhost:8080/translate")
    print("🍎 Safari test: http://localhost:8080/test-safari")
    
    app.run(debug=True, host='0.0.0.0', port=8080)
