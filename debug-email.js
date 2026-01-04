// Add this temporary debug endpoint to server.js:

app.get('/api/debug-email', requireAuth, (req, res) => {
    res.json({
        emailUser: process.env.EMAIL_USER ? 'SET' : 'MISSING',
        emailPass: process.env.EMAIL_PASS ? 'SET' : 'MISSING',
        nodeEnv: process.env.NODE_ENV
    });
});

// Simplified OTP endpoint:
app.post('/api/send-otp', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        if (!process.env.EMAIL_USER) {
            return res.status(500).json({ error: 'EMAIL_USER not configured' });
        }

        if (!process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'EMAIL_PASS not configured' });
        }

        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Code: ' + otp,
            text: otp
        });

        res.json({ success: true });
    } catch (error) {
        console.error('OTP Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});