#!/usr/bin/env python3
import sys
import json
import os
import tempfile
import uuid
import subprocess
import asyncio
import base64
import re
import random


try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

def analyze_text_context(text):
    """Analyze text to determine appropriate filler placement"""
    contexts = {
        'question': bool(re.search(r'\?', text)),
        'excitement': bool(re.search(r'!', text)),
        'list': bool(re.search(r'(first|second|third|then|next|finally)', text.lower())),
        'explanation': bool(re.search(r'(because|since|so|therefore|thus)', text.lower())),
        'uncertainty': bool(re.search(r'(maybe|perhaps|might|could|possibly)', text.lower())),
        'emphasis': bool(re.search(r'(very|really|extremely|absolutely)', text.lower())),
        'transition': bool(re.search(r'(however|but|although|meanwhile)', text.lower())),
        'greeting': bool(re.search(r'(hello|hi|hey|good morning)', text.lower()))
    }
    return contexts

def process_text_for_personality(text, style):
    """Add contextually appropriate natural speech patterns"""
    context = analyze_text_context(text)
    
    # Context-appropriate fillers
    thinking_fillers = ['um', 'uh', 'let me think', 'hmm']
    uncertainty_fillers = ['uh', 'I guess', 'maybe', 'sort of']
    explanation_fillers = ['you see', 'you know', 'I mean']
    transition_fillers = ['well', 'so', 'now']
    emphasis_fillers = ['really', 'absolutely', 'definitely']
    casual_fillers = ['like', 'you know', 'um', 'uh', 'ah']
    
    # Split into sentences
    sentences = text.split('.')
    processed_sentences = []
    
    for sentence in sentences:
        if not sentence.strip():
            continue
            
        words = sentence.split()
        
        # Context-based intelligent filler insertion
        if context['uncertainty'] and random.random() < 0.5:
            if len(words) > 2:
                insert_pos = random.randint(1, len(words)-1)
                words.insert(insert_pos, f", {random.choice(uncertainty_fillers)},")
        
        elif context['explanation'] and random.random() < 0.4:
            if len(words) > 3:
                insert_pos = random.randint(2, len(words)-1)
                words.insert(insert_pos, f", {random.choice(explanation_fillers)},")
        
        elif context['question'] and random.random() < 0.3:
            if len(words) > 2:
                words.insert(1, f"{random.choice(thinking_fillers)},")
        
        elif context['transition'] and random.random() < 0.4:
            sentence = f"{random.choice(transition_fillers)}, " + sentence
        
        elif context['emphasis'] and random.random() < 0.3:
            if len(words) > 2:
                insert_pos = random.randint(1, len(words)-1)
                words.insert(insert_pos, f", {random.choice(emphasis_fillers)},")
        
        else:
            # General natural fillers based on personality
            if len(words) > 4 and random.random() < 0.25:
                insert_pos = random.randint(2, len(words)-2)
                words.insert(insert_pos, f", {random.choice(casual_fillers)},")
        
        sentence = ' '.join(words)
        
        # Add personality-specific modifications with accents
        if style == 'friendly':
            sentence = sentence.replace('Hello', 'Hi there')
            sentence = sentence.replace('very', 'super')
            sentence = sentence.replace('good', 'great')
        elif style == 'professional':
            sentence = sentence.replace('Hello', 'Good morning')
            sentence = sentence.replace('can\'t', 'cannot')
            sentence = sentence.replace('won\'t', 'will not')
        elif style == 'casual':
            sentence = sentence.replace('Hello', 'Hey there')
            sentence = sentence.replace('Yes', 'Yeah')
            sentence = sentence.replace('going to', 'gonna')
            sentence = sentence.replace('want to', 'wanna')
            sentence = sentence.replace('got to', 'gotta')
        elif style == 'empathetic':
            sentence = sentence.replace('Hello', 'Hi there')
            sentence = sentence.replace('about', 'bout')
            sentence = sentence.replace('just', 'jus\'')
        elif style == 'authoritative':
            sentence = sentence.replace('I think', 'I know')
            sentence = sentence.replace('will', 'WILL')
            sentence = sentence.replace('talk', 'tawk')
            sentence = sentence.replace('walk', 'wawk')
        elif style == 'energetic':
            sentence = sentence.replace('Hello', 'Hey everyone!')
            sentence = sentence.replace('good', 'amazing')
            sentence = sentence.replace('totally', 'totes')
            sentence = sentence.replace('really', 'rilly')
        elif style == 'sophisticated':
            sentence = sentence.replace('Hello', 'Good evening')
            sentence = sentence.replace('nice', 'exquisite')
            sentence = sentence.replace('very', 'veddy')
            sentence = sentence.replace('rather', 'rahther')
        elif style == 'cheerful':
            sentence = sentence.replace('Hello', 'Hi there!')
            sentence = sentence.replace('good', 'wonderful')
            sentence = sentence.replace('nice', 'fantastic')
        elif style == 'confident':
            sentence = sentence.replace('Hello', 'Greetings')
            sentence = sentence.replace('I think', 'I believe')
            sentence = sentence.replace('maybe', 'certainly')
        elif style == 'creative':
            sentence = sentence.replace('Hello', 'Hey there')
            sentence = sentence.replace('interesting', 'fascinating')
            sentence = sentence.replace('good', 'brilliant')
        elif style == 'playful':
            sentence = sentence.replace('Hello', 'Hiya!')
            sentence = sentence.replace('good', 'super duper good')
            sentence = sentence.replace('nice', 'really really cool')
            sentence = sentence.replace('yes', 'yay yes')
            sentence = sentence.replace('this', 'dis')
        elif style == 'sweet':
            sentence = sentence.replace('Hello', 'Hi hi!')
            sentence = sentence.replace('good', 'sooo good')
            sentence = sentence.replace('nice', 'super nice')
            sentence = sentence.replace('my', 'my wittle')
            sentence = sentence.replace('voice', 'voicey')
        
        processed_sentences.append(sentence)
    
    # Context-appropriate sentence joining
    result = ''
    for i, sentence in enumerate(processed_sentences):
        result += sentence
        if i < len(processed_sentences) - 1:
            if context['list']:
                result += '... '
            elif context['explanation']:
                result += ', '
            else:
                result += '. '
    
    return result

def load_voice_model(voice_id):
    """Load voice model from JSON file"""
    model_path = f"models/{voice_id.replace('-premium', '_model.json')}"
    try:
        with open(model_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def apply_voice_model(text, model):
    """Apply voice model transformations to text"""
    if not model:
        return text
    
    processed_text = text
    
    # Apply speech pattern replacements
    for original, replacement in model.get('speech_patterns', {}).items():
        processed_text = processed_text.replace(original, replacement)
    
    return processed_text

def load_voice_model(voice_id):
    """Load voice model from JSON file"""
    model_path = f"models/{voice_id.replace('-premium', '_model.json')}"
    try:
        with open(model_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def apply_voice_model(text, model):
    """Apply voice model transformations to text"""
    if not model:
        return text
    
    processed_text = text
    
    # Apply speech pattern replacements
    for original, replacement in model.get('speech_patterns', {}).items():
        processed_text = processed_text.replace(original, replacement)
    
    return processed_text

def convert_with_premium_voice(text, voice, speed):
    """Convert text using premium trained voices with custom processing"""
    
    voice_configs = {
        'sarah-premium': {
            'base_voice': 'en-US-AriaNeural',
            'style': 'friendly'
        },
        'mike-premium': {
            'base_voice': 'en-US-BrianNeural', 
            'style': 'casual'
        },
        'olivia-premium': {
            'base_voice': 'en-US-JennyNeural',
            'style': 'empathetic'
        },
        'david-premium': {
            'base_voice': 'en-US-ChristopherNeural',
            'style': 'authoritative'
        },
        'luna-premium': {
            'base_voice': 'en-US-MichelleNeural',
            'style': 'energetic'
        },
        'james-premium': {
            'base_voice': 'en-US-RogerNeural',
            'style': 'sophisticated'
        },
        'alex-premium': {
            'base_voice': 'en-US-AndrewNeural',
            'style': 'professional'
        },
        'emma-premium': {
            'base_voice': 'en-US-EmmaNeural',
            'style': 'cheerful'
        },
        'ryan-premium': {
            'base_voice': 'en-US-BrianNeural',
            'style': 'confident'
        },
        'zoe-premium': {
            'base_voice': 'en-US-AvaNeural',
            'style': 'creative'
        },
        'tommy-premium': {
            'base_voice': 'en-US-EmmaNeural',
            'style': 'playful'
        },
        'lily-premium': {
            'base_voice': 'en-US-AnaNeural',
            'style': 'sweet'
        }
    }
    
    config = voice_configs.get(voice)
    if not config:
        return {'error': 'Premium voice not found'}
    
    # Check if voice has a dedicated model
    voice_model = load_voice_model(voice)
    if voice_model and 'base_voice' in voice_model:
        processed_text = apply_voice_model(text, voice_model)
        base_voice = voice_model['base_voice']
    else:
        processed_text = process_text_for_personality(text, config['style'])
        base_voice = config['base_voice']
    
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(tempfile.gettempdir(), filename)
    
    async def generate_premium_speech():
        speed_rates = {'slow': '-50%', 'normal': '+0%', 'fast': '+50%', 'very_fast': '+100%'}
        rate = speed_rates.get(speed, '+0%')
        communicate = edge_tts.Communicate(processed_text, base_voice, rate=rate)
        await communicate.save(filepath)
    
    try:
        asyncio.run(generate_premium_speech())
        with open(filepath, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        os.remove(filepath)
        return {
            'success': True,
            'audio_data': audio_data,
            'filename': filename,
            'voice_type': 'premium',
            'personality': config['style']
        }
    except Exception as e:
        return {'error': f'Premium voice failed: {str(e)}'}

def convert_with_edge_tts(text, voice, speed):
    filename = f"audio_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(tempfile.gettempdir(), filename)
    
    async def generate_speech():
        speed_rates = {'slow': '-50%', 'normal': '+0%', 'fast': '+50%', 'very_fast': '+100%'}
        rate = speed_rates.get(speed, '+0%')
        
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(filepath)
    
    try:
        asyncio.run(generate_speech())
        with open(filepath, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        os.remove(filepath)
        return {
            'success': True,
            'audio_data': audio_data,
            'filename': filename
        }
    except Exception as e:
        return {'error': f'Edge TTS failed: {str(e)}'}

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
        
        try:
            subprocess.run([
                'espeak', '-v', f'en+{variant}', '-s', wpm, '-p', pitch,
                '-w', filepath, text
            ], capture_output=True, check=True)
            
            # Convert to mp3
            mp3_path = filepath.replace('.wav', '.mp3')
            subprocess.run([
                'ffmpeg', '-i', filepath, '-y', mp3_path
            ], capture_output=True, check=True)
            
            with open(mp3_path, 'rb') as f:
                audio_data = base64.b64encode(f.read()).decode('utf-8')
            os.remove(filepath)
            os.remove(mp3_path)
            return {
                'success': True,
                'audio_data': audio_data,
                'filename': filename.replace('.wav', '.mp3')
            }
        except Exception as e:
            return {'error': f'eSpeak failed: {str(e)}'}
    
    return {'error': 'eSpeak voice not found'}

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        text = input_data['text']
        voice = input_data['voice']
        speed = input_data['speed']
        
        print(f"Processing: {text[:50]}... with voice: {voice}", file=sys.stderr)
        
        if voice.endswith('-premium'):
            result = convert_with_premium_voice(text, voice, speed)
        elif voice.startswith('en-') and EDGE_TTS_AVAILABLE:
            result = convert_with_edge_tts(text, voice, speed)
        elif voice.startswith('espeak-'):
            result = convert_with_espeak(text, voice, speed)
        else:
            result = {'error': 'Voice not available'}
        
        print(json.dumps(result), flush=True)
        
    except KeyError as e:
        print(json.dumps({'error': f'Missing required field: {str(e)}'}), flush=True)
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}'}), flush=True)
    except Exception as e:
        print(json.dumps({'error': f'Unexpected error: {str(e)}'}), flush=True)

if __name__ == '__main__':
    main()