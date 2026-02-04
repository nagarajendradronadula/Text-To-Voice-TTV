// Session and state management
function saveState() {
    const state = {
        text: document.getElementById('text').value,
        voice: document.querySelector('.tab-panel.active select').value,
        speed: document.getElementById('speed').value,
        activeTab: document.querySelector('.tab-btn.active').dataset.tab
    };
    localStorage.setItem('ttsState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('ttsState');
    if (saved) {
        const state = JSON.parse(saved);
        document.getElementById('text').value = state.text || '';
        document.getElementById('speed').value = state.speed || 'normal';
        
        // Set active tab
        if (state.activeTab) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.querySelector(`[data-tab="${state.activeTab}"]`).classList.add('active');
            document.getElementById(state.activeTab + '-tab').classList.add('active');
        }
        
        // Set voice after tab is active
        setTimeout(() => {
            const activeSelect = document.querySelector('.tab-panel.active select');
            if (activeSelect && state.voice) activeSelect.value = state.voice;
        }, 100);
        
        // Update character count
        const count = document.getElementById('text').value.length;
        document.querySelector('.char-count').textContent = `${count} / 30000 characters`;
    }
}

// Check login status
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        window.isLoggedIn = response.ok;
        return response.ok;
    } catch {
        window.isLoggedIn = false;
        return false;
    }
}

// Initialize on page load
window.addEventListener('load', async () => {
    await checkAuth();
    loadState();
});

// Save state on input changes
document.getElementById('text').addEventListener('input', saveState);
document.getElementById('speed').addEventListener('change', saveState);

document.getElementById('ttsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const text = document.getElementById('text').value.trim();
    const activeTab = document.querySelector('.tab-panel.active select');
    const voice = activeTab.value;
    const speed = document.getElementById('speed').value;
    
    if (!text) {
        showError('Please enter some text to convert into professional speech');
        return;
    }
    
    // Check if text is in English
    if (!isEnglishText(text)) {
        showError('Please use only English letters and numbers. Special characters like àáâ, ñ, ü, etc. are not supported.');
        return;
    }
    
    // Check if user is logged in or can use free generation
    const isLoggedIn = window.isLoggedIn || false;
    const hasUsedFree = localStorage.getItem('hasUsedFreeGeneration');
    const isFreeGeneration = !isLoggedIn && !hasUsedFree;
    
    showLoading();
    hideError();
    hideResult();
    
    try {
        const response = await fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, voice, speed, isFreeGeneration })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format');
        }
        
        
        if (data.success && data.audio_data) {
            const audioBlob = base64ToBlob(data.audio_data, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            showResult(audioUrl, data.filename);
            
            // Mark free generation as used
            if (isFreeGeneration) {
                localStorage.setItem('hasUsedFreeGeneration', 'true');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            }
        } else {
            throw new Error('No audio data received. Please try a different voice.');
        }
        
    } catch (error) {
        showError(`😔 ${error.message}`);
    } finally {
        hideLoading();
    }
});

// Voice preview functionality
let currentPreviewAudio = null;

function playPreview(tabType) {
    if (currentPreviewAudio) {
        currentPreviewAudio.pause();
        currentPreviewAudio = null;
        return;
    }
    
    const selectId = tabType === 'natural' ? 'voice-natural' : 'voice-normal';
    const voice = document.getElementById(selectId).value;
    const previewText = "Hello, this is a preview of my voice.";
    
    console.log('Sending preview request for voice:', voice);
    
    fetch('/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: previewText, voice, speed: 'normal', isPreview: true })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success && data.audio_data) {
            const audioBlob = base64ToBlob(data.audio_data, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            currentPreviewAudio = new Audio(audioUrl);
            currentPreviewAudio.play();
            currentPreviewAudio.onended = () => { currentPreviewAudio = null; };
        } else {
            console.error('No audio data received:', data);
        }
    })
    .catch(error => {
        console.error('Preview failed:', error);
    });
}

// Tab functionality with state saving
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        this.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
        
        saveState();
    });
});

// Voice selection with state saving
document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', saveState);
});

// Character count functionality
const textArea = document.getElementById('text');
const charCount = document.querySelector('.char-count');

textArea.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = `${count} / 30000 characters`;
});

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    const btn = document.getElementById('convertBtn');
    btn.disabled = true;
    btn.innerHTML = '🔄 Processing Your Voice...';
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    const btn = document.getElementById('convertBtn');
    btn.disabled = false;
    btn.innerHTML = '🎤 Generate Professional Voice';
}

function showResult(audioUrl, filename) {
    const resultDiv = document.getElementById('result');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadLink');
    
    audioPlayer.src = audioUrl;
    downloadLink.href = audioUrl;
    downloadLink.download = filename || 'voiceforge-audio.mp3';
    
    resultDiv.classList.remove('hidden');
    
    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideResult() {
    document.getElementById('result').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>Oops!</strong> ${message}`;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function isEnglishText(text) {
    const englishOnlyPattern = /^[a-zA-Z0-9\s\.,!?;:"'()\-]+$/;
    return englishOnlyPattern.test(text.trim());
}