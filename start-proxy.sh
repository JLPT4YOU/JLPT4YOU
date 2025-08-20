#!/bin/bash

# Script to start the Google Translate Proxy Server
# For local development and testing Safari CORS bypass

echo "🚀 Starting Google Translate Proxy Server..."
echo "📍 Server will run on: http://localhost:8080"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "📦 Installing required Python packages..."
    pip3 install flask flask-cors requests
fi

# Start the proxy server
echo "✅ Starting proxy server..."
echo "   - Use Ctrl+C to stop the server"
echo ""

# Run the proxy server
python3 proxy_server.py
