#!/usr/bin/env python3
import subprocess
import tempfile
import os
import base64

def create_kid_voice(text, voice_type='boy', pitch_shift=50, speed=200):
    """Create synthetic kid voice using espeak with high pitch"""
    
    temp_wav = tempfile.mktemp(suffix='.wav')
    temp_mp3 = temp_wav.replace('.wav', '.mp3')
    
    try:
        # Generate high-pitched audio with espeak
        if voice_type == 'boy':
            subprocess.run(['espeak', '-v', 'en+f3', '-s', str(speed), '-p', str(pitch_shift + 20), '-w', temp_wav, text], 
                         capture_output=True, check=True)
        else:  # girl
            subprocess.run(['espeak', '-v', 'en+f4', '-s', str(speed + 10), '-p', str(pitch_shift + 30), '-w', temp_wav, text], 
                         capture_output=True, check=True)
        
        # Convert to mp3
        subprocess.run(['ffmpeg', '-i', temp_wav, '-y', temp_mp3], 
                      capture_output=True, check=True)
        
        # Read and encode
        with open(temp_mp3, 'rb') as f:
            audio_data = base64.b64encode(f.read()).decode('utf-8')
        
        return {
            'success': True,
            'audio_data': audio_data,
            'filename': f'kid_voice_{voice_type}.mp3'
        }
        
    except Exception as e:
        return {'error': f'Kid voice generation failed: {str(e)}'}
    
    finally:
        # Cleanup
        for temp_file in [temp_wav, temp_mp3]:
            if os.path.exists(temp_file):
                os.remove(temp_file)

def convert_with_kid_voice(text, voice, speed):
    """Convert text using custom kid voice synthesis"""
    
    # Apply speech pattern transformations
    if 'tommy' in voice:
        # Tommy's patterns
        text = text.replace('Hello', 'Hiya!')
        text = text.replace('good', 'super duper good')
        text = text.replace('this', 'dis')
        text = text.replace('really', 'weally')
        return create_kid_voice(text, 'boy', pitch_shift=70, speed=220)
    
    elif 'lily' in voice:
        # Lily's patterns  
        text = text.replace('Hello', 'Hewwo!')
        text = text.replace('good', 'sooo good')
        text = text.replace('my', 'my wittle')
        text = text.replace('voice', 'voicey')
        text = text.replace('really', 'weally weally')
        return create_kid_voice(text, 'girl', pitch_shift=80, speed=230)
    
    return {'error': 'Unknown kid voice'}