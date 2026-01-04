// Add debug logs to your existing OTP endpoint:

app.post('/api/send-otp', requireAuth, async (req, res) => {
    try {
        console.log('=== OTP REQUEST START ===');
        
        const user = await User.findById(req.session.userId);
        if (!user) {
            console.log('ERROR: User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User found:', user.email);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        
        console.log('OTP saved to database:', otp);

        console.log('Email credentials check:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');

        console.log('Creating transporter...');
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log('Attempting to send email...');
        console.log('From:', process.env.EMAIL_USER);
        console.log('To:', user.email);

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'VoiceForge - Verification Code',
            text: `Your verification code: ${otp}`
        });

        console.log('Email sent successfully!');
        console.log('=== OTP REQUEST END ===');
        
        res.json({ success: true });
    } catch (error) {
        console.log('=== ERROR DETAILS ===');
        console.log('Error message:', error.message);
        console.log('Error code:', error.code);
        console.log('Error stack:', error.stack);
        console.log('=== ERROR END ===');
        
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});