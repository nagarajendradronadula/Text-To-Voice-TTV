#!/bin/bash

echo "🚀 Setting up Text-to-Voice Express.js Application..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if Python dependencies are installed
echo "🐍 Checking Python dependencies..."
python3 -c "import flask, edge_tts, requests" 2>/dev/null || {
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
}

# Make Python script executable
chmod +x tts_converter.py

echo "✅ Setup complete!"
echo "🎤 Starting Text-to-Voice server..."
echo "📍 Server will be available at: http://localhost:3000"

# Start the server
npm start