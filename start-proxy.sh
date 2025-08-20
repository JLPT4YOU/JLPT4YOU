#!/bin/bash

# Start Google Translate Proxy Server for Safari bypass
# This script starts the Python proxy server on port 8080

echo "🚀 Starting Google Translate Proxy Server for Safari bypass..."
echo "📍 Server will be available at: http://localhost:8080"
echo "🔧 API endpoint: http://localhost:8080/translate"
echo "🍎 Safari test: http://localhost:8080/test-safari"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if required packages are installed
echo "📦 Checking required packages..."
python3 -c "import flask, flask_cors, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing required packages..."
    pip3 install flask flask-cors requests
fi

# Start the proxy server
echo "🔄 Starting proxy server..."
python3 proxy_server.py
