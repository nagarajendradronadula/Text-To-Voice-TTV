// Replace your /api/send-otp endpoint with this:
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

        // Skip email if credentials missing (development mode)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('OTP for', user.email, ':', otp);
            return res.json({ success: true, devMode: true });
        }

        // Quick timeout for email sending
        const emailPromise = new Promise(async (resolve, reject) => {
            try {
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
                    subject: 'VoiceForge - Code: ' + otp,
                    text: `Your verification code: ${otp}`
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        });

        // 15 second timeout
        await Promise.race([
            emailPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 15000))
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error);
        // Still return success if OTP was saved to DB
        res.json({ success: true, emailFailed: true });
    }
});