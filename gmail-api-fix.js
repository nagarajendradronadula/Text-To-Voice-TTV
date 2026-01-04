// Install: npm install googleapis

const { google } = require('googleapis');

// Gmail API setup (bypasses SMTP)
async function sendEmailViaGmailAPI(to, subject, text) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        text
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });
}

// OTP endpoint using Gmail API
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

        await sendEmailViaGmailAPI(
            user.email,
            'VoiceForge - Code: ' + otp,
            `Your verification code: ${otp}\n\nExpires in 10 minutes.`
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Setup instructions:
// 1. Go to Google Cloud Console
// 2. Enable Gmail API
// 3. Create OAuth2 credentials
// 4. Get refresh token from OAuth Playground
// 5. Set env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN