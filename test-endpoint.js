// Add this simple test endpoint first:

app.post('/api/send-otp', requireAuth, async (req, res) => {
    console.log('OTP ENDPOINT HIT!');
    console.log('User ID:', req.session.userId);
    console.log('Request body:', req.body);
    
    res.json({ success: true, message: 'Endpoint working' });
});

// Also add this to check if auth middleware is blocking:
app.post('/api/test-otp', async (req, res) => {
    console.log('TEST ENDPOINT HIT - NO AUTH');
    res.json({ success: true, message: 'No auth test working' });
});