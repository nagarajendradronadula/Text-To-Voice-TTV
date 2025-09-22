from flask import Flask, render_template, request, jsonify
import os
import tempfile
import uuid
import subprocess
import asyncio
import requests
import json
import base64
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

app = Flask(__name__, template_folder='../templates', static_folder='../public')

# Murf AI API configuration
MURF_API_KEY = os.environ.get('MURF_API_KEY', 'ap2_10079d88-9641-4808-8047-ec1aff896b0d')
MURF_API_URL = 'https://api.murf.ai/v1/speech/generate'

# Real TTS engines with actual different voices
VOICES = {
    # Murf AI voices (actual voice models)
    'en-us-natalie': 'Natalie (Murf) - Inspirational Female',
    'en-us-ken': 'Ken (Murf) - Conversational Male',
    'en-us-amara': 'Amara (Murf) - Conversational Female',
    'en-us-charles': 'Charles (Murf) - Conversational Male',
    'en-uk-hazel': 'Hazel (Murf) - British Conversational Female',
    'en-uk-ruby': 'Ruby (Murf) - British Conversational Female',
    'en-us-ariana': 'Ariana (Murf) - Conversational Female',
    'en-us-carter': 'Carter (Murf) - Conversational Male',
    'en-scott-emily': 'Emily (Murf) - Scottish Narration Female',
    'it-it-giorgio': 'Giorgio (Murf) - Italian Narration Male',
    'en-us-marcus': 'Marcus (Murf) - Conversational Male',
    
    # Edge TTS - Microsoft voices
    'en-US-AriaNeural': 'Aria (Microsoft)',
    'en-US-GuyNeural': 'Guy (Microsoft)',
    'en-US-JennyNeural': 'Jenny (Microsoft)',
    'en-US-DavisNeural': 'Davis (Microsoft)',
    'en-US-AmberNeural': 'Amber (Microsoft)',
    'en-US-BrandonNeural': 'Brandon (Microsoft)',
    
    # eSpeak voices
    'espeak-f1': 'Robot Female (eSpeak)',
    'espeak-m1': 'Robot Male (eSpeak)'
}

@app.route('/')
def index():
    return render_template('index.html', voices=VOICES)

@app.route('/convert', methods=['POST'])
def convert_text():
    text = request.form.get('text', '').strip()
    voice = request.form.get('voice', 'en-US-natalie')
    speed = request.form.get('speed', 'normal')
    
    if not text:
        return jsonify({'error': 'Please enter some text'}), 400
    
    try:
        if voice.startswith('en-us-') or voice.startswith('en-uk-') or voice.startswith('en-scott-') or voice.startswith('it-it-'):
            return convert_with_murf(text, voice, speed)
        elif voice.startswith('en-') and EDGE_TTS_AVAILABLE:
            return convert_with_edge_tts(text, voice, speed)
        elif voice.startswith('espeak-'):
            return convert_with_espeak(text, voice, speed)
        else:
            return jsonify({'error': 'Voice not available'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def convert_with_edge_tts(text, voice, speed):
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(tempfile.gettempdir(), filename)
    
    async def generate_speech():
        speed_rates = {'slow': '-20%', 'normal': '+0%', 'fast': '+20%', 'very_fast': '+40%'}
        rate = speed_rates.get(speed, '+0%')
        
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(filepath)
    
    try:
        asyncio.run(generate_speech())
        with open(filepath, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        os.remove(filepath)
        return jsonify({
            'success': True,
            'audio_data': audio_data,
            'filename': filename
        })
    except Exception:
        return jsonify({'error': 'Edge TTS failed'}), 500

def convert_with_espeak(text, voice, speed):
    filename = f"audio_{uuid.uuid4().hex}.wav"
    filepath = os.path.join(tempfile.gettempdir(), filename)
    
    voice_map = {
        'espeak-f1': {'variant': 'f1', 'pitch': '50'},
        'espeak-m1': {'variant': 'm1', 'pitch': '30'}
    }
    
    speed_map = {'slow': '120', 'normal': '175', 'fast': '220', 'very_fast': '280'}
    wpm = speed_map.get(speed, '175')
    
    if voice in voice_map:
        variant = voice_map[voice]['variant']
        pitch = voice_map[voice]['pitch']
        
        subprocess.run([
            'espeak', '-v', f'en+{variant}', '-s', wpm, '-p', pitch,
            '-w', filepath, text
        ], capture_output=True)
        
        # Convert to mp3
        mp3_path = filepath.replace('.wav', '.mp3')
        subprocess.run([
            'ffmpeg', '-i', filepath, '-y', mp3_path
        ], capture_output=True)
        
        with open(mp3_path, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        os.remove(filepath)
        os.remove(mp3_path)
        return jsonify({
            'success': True,
            'audio_data': audio_data,
            'filename': filename.replace('.wav', '.mp3')
        })
    
    return jsonify({'error': 'eSpeak failed'}), 500

def convert_with_murf(text, voice, speed):
    voice_styles = {
        'en-us-natalie': 'Inspirational',
        'en-us-ken': 'Conversational',
        'en-us-amara': 'Conversational',
        'en-us-charles': 'Conversational',
        'en-uk-hazel': 'Conversational',
        'en-uk-ruby': 'Conversational',
        'en-us-ariana': 'Conversational',
        'en-us-carter': 'Conversational',
        'en-scott-emily': 'Narration',
        'it-it-giorgio': 'Narration',
        'en-us-marcus': 'Conversational'
    }
    
    speed_map = {'slow': -20, 'normal': 0, 'fast': 20, 'very_fast': 40}
    speech_rate = speed_map.get(speed, 0)
    
    payload = {
        'voiceId': voice,
        'style': voice_styles.get(voice, 'Conversational'),
        'text': text,
        'rate': speech_rate,
        'pitch': 0,
        'sampleRate': 48000,
        'format': 'MP3',
        'channelType': 'MONO',
        'pronunciationDictionary': {},
        'encodeAsBase64': True,
        'variation': 1
    }
    
    headers = {
        'Accept': 'application/json',
        'api-key': MURF_API_KEY,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(MURF_API_URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            response_data = response.json()
            if 'audioFile' in response_data:
                # Download from the provided URL
                audio_url = response_data['audioFile']
                audio_response = requests.get(audio_url)
                if audio_response.status_code == 200:
                    audio_data = base64.b64encode(audio_response.content).decode('utf-8')
                    return jsonify({
                        'success': True,
                        'audio_data': audio_data,
                        'filename': f"audio_{uuid.uuid4().hex}.mp3"
                    })
            elif 'audioContent' in response_data:
                return jsonify({
                    'success': True,
                    'audio_data': response_data['audioContent'],
                    'filename': f"audio_{uuid.uuid4().hex}.mp3"
                })
        
        return jsonify({'error': f'Murf API failed: {response.status_code}'}), 500
    except Exception as e:
        return jsonify({'error': f'Murf API error: {str(e)}'}), 500

# Vercel serverless function handler
def handler(request):
    return app(request.environ, lambda status, headers: None)