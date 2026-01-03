// Replace the OTP endpoint in server.js with this:

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

        // Skip email if credentials missing
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('OTP for', user.email, ':', otp);
            return res.json({ success: true });
        }

        try {
            const transporter = nodemailer.createTransporter({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: { rejectUnauthorized: false }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'VoiceForge - Code: ' + otp,
                text: `Your verification code: ${otp}\n\nExpires in 10 minutes.`
            });
        } catch (emailError) {
            console.error('Email failed:', emailError);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});