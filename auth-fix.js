// Add this before calling /api/send-otp
async function sendOTP() {
    try {
        // Check if user is authenticated first
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.redirected) {
            window.location.href = '/login';
            return;
        }

        const data = await response.json();
        console.log('OTP sent:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}