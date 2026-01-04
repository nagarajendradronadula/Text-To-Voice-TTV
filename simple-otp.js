// Simple fix - show OTP in response for now:

app.post('/api/send-otp', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = '123456'; // Fixed OTP
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        res.json({ 
            success: true, 
            message: 'Verification code: 123456',
            otp: '123456'
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});