// Debug email - replace OTP endpoint with this:

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

        console.log('Environment check:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({ success: false, error: 'Email credentials not configured' });
        }

        const transporter = nodemailer.createTransporter({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            debug: true,
            logger: true
        });

        console.log('Attempting to send email to:', user.email);
        
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'VoiceForge - Code: ' + otp,
            text: `Your verification code: ${otp}\n\nExpires in 10 minutes.`
        });

        console.log('Email sent successfully:', info.messageId);
        res.json({ success: true, messageId: info.messageId });

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        res.status(500).json({ 
            error: 'Failed to send OTP',
            details: error.message 
        });
    }
});