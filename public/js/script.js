document.getElementById('ttsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const text = formData.get('text').trim();
    
    if (!text) {
        showError('Please enter some text to convert');
        return;
    }
    
    showLoading();
    hideError();
    hideResult();
    
    try {
        const response = await fetch('/convert', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Conversion failed');
        }
        
        if (data.success && data.audio_data) {
            const audioBlob = base64ToBlob(data.audio_data, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            showResult(audioUrl, data.filename);
        } else {
            throw new Error('No audio data received');
        }
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
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
    document.getElementById('convertBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('convertBtn').disabled = false;
}

function showResult(audioUrl, filename) {
    const resultDiv = document.getElementById('result');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadLink');
    
    audioPlayer.src = audioUrl;
    downloadLink.href = audioUrl;
    downloadLink.download = filename || 'audio.mp3';
    
    resultDiv.classList.remove('hidden');
}

function hideResult() {
    document.getElementById('result').classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}