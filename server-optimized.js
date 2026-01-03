const nodemailer = require('nodemailer');

// Optimized transporter with connection pooling
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 8000,
    socketTimeout: 8000
});

// Optimized OTP endpoint
app.post('/api/send-otp', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'VoiceForge - Verification Code',
            html: `<div style="text-align: center; padding: 20px;"><h1>VoiceForge</h1><div style="background: #000; color: #fff; padding: 20px; font-size: 2em; margin: 20px 0;">${otp}</div><p>Expires in 10 minutes.</p></div>`
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});