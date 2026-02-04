# AWS Deployment Guide - Text-to-Voice App

## 1. AWS EC2 Setup

### Launch EC2 Instance:
```bash
# Choose Ubuntu 22.04 LTS
# Instance type: t3.micro (free tier)
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
# Key pair: Create new or use existing
```

### Connect to EC2:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Install Dependencies:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install python3 python3-pip -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

## 2. Deploy Application

### Clone and Setup:
```bash
# Clone your repo
git clone https://github.com/your-username/Text-To-Voice-TTV.git
cd Text-To-Voice-TTV

# Install Node dependencies
npm install

# Install Python dependencies
pip3 install -r requirements.txt
```

### Environment Variables:
```bash
# Create .env file
nano .env
```

```env
# MongoDB (use MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voiceforge

# Session Secret
SESSION_SECRET=your-super-secret-key-here

# Gmail SMTP (will work on EC2)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Murf API (if using)
MURF_API_KEY=your-murf-api-key

# Port
PORT=3000
```

### Start Application:
```bash
# Start with PM2
pm2 start server.js --name "voiceforge"
pm2 startup
pm2 save
```

## 3. Nginx Configuration

### Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/voiceforge
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/voiceforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. SSL Certificate (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 5. MongoDB Atlas Setup

1. Go to mongodb.com/atlas
2. Create free cluster
3. Create database user
4. Whitelist EC2 IP address
5. Get connection string

## 6. Domain Setup

1. Point your domain to EC2 public IP
2. Update security group if needed
3. Test application

## 7. Restore Original SMTP Code

Replace the OTP endpoint in server.js:

```javascript
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
            subject: 'VoiceForge - Verification Code',
            html: `
                <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: 0 auto; background: #fff; border: 8px solid #000;">
                    <div style="background: repeating-linear-gradient(45deg, #000 0px, #000 10px, #fff 10px, #fff 20px); padding: 4px;">
                        <div style="background: #fff; padding: 40px; text-align: center;">
                            <h1 style="color: #000; font-size: 2.5em; font-weight: 900; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px;">VOICEFORGE</h1>
                            <div style="border: 4px solid #000; padding: 30px; margin: 20px 0; background: #f8f8f8;">
                                <h2 style="color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Verification Code</h2>
                                <div style="background: #000; color: #fff; padding: 20px; font-size: 2em; font-weight: 900; letter-spacing: 4px; margin: 20px 0;">${otp}</div>
                                <p style="color: #333; font-weight: 600; margin: 15px 0;">This code will expire in 10 minutes.</p>
                                <p style="color: #666; font-size: 0.9em;">If you didn't request this, please ignore this email.</p>
                            </div>
                            <div style="border-top: 4px solid #000; padding-top: 20px; margin-top: 30px;">
                                <p style="color: #000; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">VoiceForge Team</p>
                            </div>
                        </div>
                    </div>
                </div>
            `
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});
```

## 8. Cost Estimate

- **EC2 t3.micro**: Free tier (12 months) then ~$10/month
- **MongoDB Atlas**: Free tier (512MB)
- **Domain**: ~$12/year
- **Total**: Free for 1 year, then ~$10/month

SMTP will work perfectly on EC2 since it's a VPS with unrestricted outbound connections.