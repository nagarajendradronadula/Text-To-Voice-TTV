# Text to Voice Converter 

An Express.js web application that converts text to human-like speech with different accents and voices from around the world. Uses Python TTS engines for audio generation.

## Features

- **Multiple Voice Options**: Murf AI, Microsoft Edge TTS, and eSpeak voices
- **Three TTS Engines**: Murf AI (premium), Edge TTS (online), and eSpeak (offline)
- **Web Interface**: Clean, responsive design
- **Audio Playback**: Listen directly in browser
- **Download Option**: Save audio files locally
- **Express.js Backend**: Fast Node.js server with Python TTS integration

## Installation

### Quick Start
```bash
chmod +x start.sh
./start.sh
```

### Manual Installation
1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

3. Run the application:
```bash
npm start
```

4. Open your browser and go to: `http://localhost:3000`

## Usage

1. Enter your text in the textarea
2. Select your preferred voice/accent
3. Choose speech speed
4. Click "Convert to Speech"
5. Listen to the audio or download it

## Voice Options

### Murf AI Voices (Premium Quality)
- Natalie - Inspirational Female (US)
- Ken - Conversational Male (US)
- Amara - Conversational Female (US)
- Charles - Conversational Male (US)
- Hazel - British Conversational Female (UK)
- Ruby - British Conversational Female (UK)
- Ariana - Conversational Female (US)
- Carter - Conversational Male (US)
- Emily - Scottish Narration Female
- Giorgio - Italian Narration Male
- Marcus - Conversational Male (US)

### Microsoft Edge TTS
- Aria, Guy, Jenny, Davis, Amber, Brandon

### eSpeak (Offline)
- Robot Female and Male voices

## Architecture

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Express.js (Node.js)
- **TTS Processing**: Python scripts with multiple engines
- **Communication**: JSON API between Express.js and Python

## Environment Variables

- `MURF_API_KEY`: Your Murf AI API key (optional, has default)
- `PORT`: Server port (default: 3000)