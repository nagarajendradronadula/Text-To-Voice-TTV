const nodemailer = require('nodemailer');
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { franc } = require('franc');
const bcrypt = require('bcryptjs');
const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('./models/User');
const History = require('./models/History');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// app.use(passport.initialize());
// app.use(passport.session());

// // Google OAuth Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "/auth/google/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//     try {
//         let user = await User.findOne({ googleId: profile.id });
//         if (user) {
//             return done(null, user);
//         }
//         
//         user = await User.findOne({ email: profile.emails[0].value });
//         if (user) {
//             user.googleId = profile.id;
//             await user.save();
//             return done(null, user);
//         }
//         
//         // Store Google profile data in session for username setup
//         return done(null, { 
//             isNewGoogleUser: true,
//             googleId: profile.id,
//             name: profile.displayName,
//             email: profile.emails[0].value
//         });
//     } catch (error) {
//         return done(error, null);
//     }
// }));

// passport.serializeUser((user, done) => {
//     if (user.isNewGoogleUser) {
//         done(null, { isNewGoogleUser: true, googleId: user.googleId });
//     } else {
//         done(null, user._id);
//     }
// });

// passport.deserializeUser(async (data, done) => {
//     try {
//         if (data.isNewGoogleUser) {
//             done(null, data);
//         } else {
//             const user = await User.findById(data);
//             done(null, user);
//         }
//     } catch (error) {
//         done(error, null);
//     }
// });

// Voice options (same as Python app)
const VOICES = {
    'en-us-natalie': 'Natalie (Murf) - Inspirational Female',
    'en-us-ken': 'Ken (Murf) - Conversational Male',
    'en-us-amara': 'Amara (Murf) - Conversational Female',
    'en-us-charles': 'Charles (Murf) - Conversational Male',
    'en-uk-hazel': 'Hazel (Murf) - British Conversational Female',
    'en-uk-ruby': 'Ruby (Murf) - British Conversational Female',
    'en-us-ariana': 'Ariana (Murf) - Conversational Female',
    'en-us-carter': 'Carter (Murf) - Conversational Male',
    'en-scott-emily': 'Emily (Murf) - Scottish Narration Female',
    'it-it-giorgio': 'Giorgio (Murf) - Italian Narration Male',
    'en-us-marcus': 'Marcus (Murf) - Conversational Male',
    'sarah-premium': 'Sarah - Friendly Female',
    'mike-premium': 'Mike - Casual Male',
    'olivia-premium': 'Olivia - Empathetic Female',
    'david-premium': 'David - Authoritative Male',
    'luna-premium': 'Luna - Energetic Female',
    'james-premium': 'James - Sophisticated Male',
    'en-US-AriaNeural': 'Aria (Microsoft)',
    'en-US-GuyNeural': 'Guy (Microsoft)',
    'en-US-JennyNeural': 'Jenny (Microsoft)',
    'en-US-DavisNeural': 'Davis (Microsoft)',
    'en-US-AmberNeural': 'Amber (Microsoft)',
    'en-US-BrandonNeural': 'Brandon (Microsoft)',
    'espeak-f1': 'Robot Female (eSpeak)',
    'espeak-m1': 'Robot Male (eSpeak)'
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// API Routes (before other routes)
app.get('/api/check-username/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        if (username.length < 6 || !/^[a-zA-Z0-9]+$/.test(username)) {
            return res.json({ available: false, error: 'Invalid format' });
        }
        const existingUser = await User.findOne({ username });
        res.json({ available: !existingUser });
    } catch (error) {
        console.error('Username check error:', error);
        res.status(500).json({ error: 'Check failed' });
    }
});

// Authentication routes
app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
//     if (req.user.isNewGoogleUser) {
//         req.session.googleUserData = {
//             googleId: req.user.googleId,
//             name: req.user.name,
//             email: req.user.email
//         };
//         res.redirect('/setup-username');
//     } else {
//         req.session.userId = req.user._id;
//         res.redirect('/');
//     }
// });

app.get('/setup-username', (req, res) => {
    if (!req.session.googleUserData) {
        return res.redirect('/login');
    }
    const html = fs.readFileSync(path.join(__dirname, 'public', 'setup-username.html'), 'utf8')
        .replace(/{{userName}}/g, req.session.googleUserData.name)
        .replace('{{userEmail}}', req.session.googleUserData.email);
    res.send(html);
});

app.get('/profile', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/history', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.post('/register', async (req, res) => {
    try {
        const { name, username, email, dateOfBirth, password } = req.body;
        
        if (!name || !username || !email || !dateOfBirth || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const existingUser = await User.findOne({
            $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, username, email, dateOfBirth, password: hashedPassword });
        await user.save();
        
        req.session.userId = user._id;
        res.json({ success: true });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/setup-username', async (req, res) => {
    try {
        const { username, dateOfBirth } = req.body;
        const googleData = req.session.googleUserData;
        
        if (!googleData || !username || !dateOfBirth) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        const user = new User({
            name: googleData.name,
            username,
            email: googleData.email,
            dateOfBirth,
            googleId: googleData.googleId
        });
        await user.save();
        
        req.session.userId = user._id.toString();
        delete req.session.googleUserData;
        res.json({ success: true });
    } catch (error) {
        console.error('Username setup error:', error);
        res.status(500).json({ error: 'Setup failed' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if ((!username && !email) || !password) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }
        
        const identifier = username || email;
        const user = await User.findOne({
            $or: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }]
        });
        
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        
        if (!user.password) {
            return res.status(400).json({ error: 'Please use Google sign-in for this account' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }
        
        req.session.userId = user._id.toString();
        res.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ 
            name: user.name, 
            username: user.username, 
            email: user.email,
            hasPassword: !!user.password,
            isGoogleUser: !!user.googleId
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Generate and send OTP
app.post('/api/send-otp', requireAuth, async (req, res) => {
    console.log('=== OTP ENDPOINT HIT ===');
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        console.log('OTP saved:', otp, 'for user:', user.email);

        // // Email sending commented out
        // const transporter = nodemailer.createTransporter({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });

        // await transporter.sendMail({
        //     from: process.env.EMAIL_USER,
        //     to: user.email,
        //     subject: 'VoiceForge - Verification Code',
        //     html: `...`
        // });

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error.message, error.code);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP and update profile
app.put('/api/user', requireAuth, async (req, res) => {
    try {
        const { name, username, email, password, newPassword, otp } = req.body;
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if only name is being updated (no OTP required)
        const isOnlyNameUpdate = name !== user.name && 
                               username === user.username && 
                               email === user.email && 
                               !newPassword;

        if (!isOnlyNameUpdate) {
            // Verify OTP for sensitive changes
            if (!otp || !user.otp || user.otp !== otp) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }
            
            if (!user.otpExpires || user.otpExpires < new Date()) {
                return res.status(400).json({ error: 'Verification code expired' });
            }
        }

        // Validate password for password change
        if (newPassword) {
            if (user.password && !password) {
                return res.status(400).json({ error: 'Current password required' });
            }
            
            if (user.password && !await bcrypt.compare(password, user.password)) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
        }

        // Check for existing username/email
        if (username !== user.username || email !== user.email) {
            const existingUser = await User.findOne({
                _id: { $ne: req.session.userId },
                $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
            });
            
            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
        }

        // Update user
        const updateData = {
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase()
        };

        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Clear OTP after successful verification
        if (!isOnlyNameUpdate) {
            updateData.otp = undefined;
            updateData.otpExpires = undefined;
        }

        await User.findByIdAndUpdate(req.session.userId, updateData);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.get('/api/history', requireAuth, async (req, res) => {
    try {
        const history = await History.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

app.delete('/api/history/:id', requireAuth, async (req, res) => {
    try {
        await History.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({ error: 'Failed to delete history item' });
    }
});

// Routes
app.get('/', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8')
        .replace('{{voices}}', JSON.stringify(VOICES));
    res.send(html);
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
});

app.post('/feedback', async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        
        if (!email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Skip email sending if credentials not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Feedback received:', { email, subject, message });
            return res.json({ success: true });
        }
        
        // // Email sending commented out
        // const transporter = nodemailer.createTransporter({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });
        
        // await transporter.sendMail({
        //     from: process.env.EMAIL_USER,
        //     to: process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER,
        //     subject: `VOICEFORGE - ${subject}`,
        //     html: `...`
        // });
        
        // await transporter.sendMail({
        //     from: process.env.EMAIL_USER,
        //     to: email,
        //     subject: 'VOICEFORGE - Feedback Received',
        //     html: `...`
        // });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Failed to send feedback' });
    }
});

app.post('/convert', async (req, res) => {
    const { text, voice = 'en-us-natalie', speed = 'normal', isFreeGeneration = false, isPreview = false } = req.body;
    
    // Set timeout to 20 minutes for large text processing
    req.setTimeout(1200000);
    res.setTimeout(1200000);
    
    if (!req.session.userId && !isFreeGeneration && !isPreview) {
        return res.status(401).json({ error: 'Please login to continue using text-to-speech conversion' });
    }
    
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Please enter some text' });
    }

    // Allow up to 30000 characters
    if (text.length > 30000) {
        return res.status(400).json({ error: 'Text too long. Please use 30000 characters or less.' });
    }

    const cleanText = text.trim();

    // For large text, process in chunks
    if (cleanText.length > 2000) {
        try {
            const chunks = [];
            const sentences = cleanText.split(/[.!?]+/);
            let currentChunk = '';
            
            for (const sentence of sentences) {
                if ((currentChunk + sentence).length > 2000 && currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = sentence;
                } else {
                    currentChunk += sentence + '.';
                }
            }
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            
            const audioChunks = [];
            for (const chunk of chunks) {
                const result = await processTextChunk(chunk, voice, speed);
                if (result.error) throw new Error(result.error);
                audioChunks.push(result.audio_data);
            }
            
            // Combine audio chunks (simplified - just use first chunk for now)
            const combinedResult = {
                success: true,
                audio_data: audioChunks[0], // In production, you'd combine these
                filename: `voiceforge-${Date.now()}.mp3`
            };
            
            // Save to history
            if (req.session.userId && !isPreview) {
                const historyEntry = new History({
                    userId: req.session.userId,
                    text: cleanText,
                    voice,
                    speed,
                    audioUrl: `data:audio/mp3;base64,${combinedResult.audio_data}`
                });
                await historyEntry.save();
            }
            
            res.json(combinedResult);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        // Process normally for smaller text
        const result = await processTextChunk(cleanText, voice, speed);
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }
        
        if (req.session.userId && !isPreview) {
            const historyEntry = new History({
                userId: req.session.userId,
                text: cleanText,
                voice,
                speed,
                audioUrl: `data:audio/mp3;base64,${result.audio_data}`
            });
            await historyEntry.save();
        }
        
        res.json(result);
    }
});

function processTextChunk(text, voice, speed) {
    return new Promise((resolve) => {
        const python = spawn('python3', ['tts_converter.py'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        const input = JSON.stringify({ text, voice, speed });
        python.stdin.write(input);
        python.stdin.end();

        let output = '';
        let error = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                resolve({ error: error || 'TTS conversion failed' });
            } else {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (e) {
                    resolve({ error: 'Invalid response from TTS service' });
                }
            }
        });
    });
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});