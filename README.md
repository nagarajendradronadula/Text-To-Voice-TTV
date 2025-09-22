# Text to Voice Converter 

A Python Flask web application that converts text to human-like speech with different accents and voices from around the world.

## Features

- **Multiple Voice Options**: English accents from US, UK, Australia, India, Canada, and South Africa
- **Two TTS Engines**: Google TTS (online) and pyttsx3 (offline)
- **Web Interface**: Clean, responsive design
- **Audio Playback**: Listen directly in browser
- **Download Option**: Save audio files locally

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and go to: `http://localhost:5000`

## Usage

1. Enter your text in the textarea
2. Select your preferred voice/accent
3. Choose TTS engine (Google TTS recommended for better quality)
4. Click "Convert to Speech"
5. Listen to the audio or download it

## Voice Options

- English (US) - American accent
- English (UK) - British accent  
- English (Australia) - Australian accent
- English (India) - Indian accent
- English (Canada) - Canadian accent
- English (South Africa) - South African accent