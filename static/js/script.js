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
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Conversion failed');
        }
        
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        
        showResult(audioUrl);
        
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('convertBtn').disabled = true;
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('convertBtn').disabled = false;
}

function showResult(audioUrl) {
    const resultDiv = document.getElementById('result');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadLink');
    
    audioPlayer.src = audioUrl;
    downloadLink.href = audioUrl;
    
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