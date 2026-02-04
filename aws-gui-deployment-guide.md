# AWS Deployment Guide - GUI Version 🖥️

## Step 1: Create AWS Account & Access EC2

1. **Go to AWS Console**: https://aws.amazon.com/console/
2. **Sign up** for free account (requires credit card but won't charge for free tier)
3. **Login** to AWS Management Console
4. **Search "EC2"** in the top search bar
5. **Click "EC2"** from dropdown

## Step 2: Launch EC2 Instance (GUI)

### 2.1 Launch Instance
- Click **"Launch Instance"** orange button
- Name: `voiceforge-app`

### 2.2 Choose AMI (Operating System)
- Select **"Ubuntu Server 24.04 LTS"** (latest version)**
- Architecture: **64-bit (x86)**

### 2.3 Choose Instance Type
- Select **"t3.micro"** (Free tier eligible)
- Shows "Free tier eligible" green text

### 2.4 Key Pair (Login)
- Click **"Create new key pair"**
- Name: `voiceforge-key`
- Type: **RSA**
- Format: **.pem**
- Click **"Create key pair"** - downloads .pem file

### 2.5 Network Settings
- Click **"Edit"** next to Network settings
- **Security Group Name**: `voiceforge-sg`
- **Add Rules**:
  - SSH (22) - Source: My IP
  - HTTP (80) - Source: Anywhere
  - HTTPS (443) - Source: Anywhere
  - Custom TCP (3000) - Source: Anywhere

### 2.6 Storage
- Keep default **8 GB gp3** (free tier)

### 2.7 Launch
- Click **"Launch Instance"** orange button
- Wait 2-3 minutes for "Running" status

## Step 3: Connect to Instance (GUI)

### 3.1 Get Connection Details
- Go to **EC2 Dashboard**
- Click **"Instances"** in left sidebar
- Select your `voiceforge-app` instance
- Copy **"Public IPv4 address"**

### 3.2 Connect via Browser (Easy Way)
- Click **"Connect"** button at top
- Choose **"EC2 Instance Connect"** tab
- Click **"Connect"** - opens terminal in browser

### 3.3 Or Connect via SSH Client
- Use downloaded .pem file
- Command: `ssh -i voiceforge-key.pem ubuntu@YOUR-IP`

## Step 4: Setup Application (Copy-Paste Commands)

### 4.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Node.js 22 (Latest LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```
**Verify installation:**
```bash
node --version
npm --version
```

### 4.3 Install Python & Tools
```bash
sudo apt install python3 python3-pip python3.12-venv nginx git -y
sudo npm install -g pm2
```

### 4.4 Clone Your Project
```bash
git clone https://github.com/nagarajendradronadula/Text-To-Voice-TTV.git
cd Text-To-Voice-TTV
```

### 4.5 Setup Python Virtual Environment & Install Dependencies
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
npm install
```

### 4.6 Create Environment File
```bash
nano .env
```
**Paste this and edit values:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voiceforge
SESSION_SECRET=your-super-secret-key-here
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
PORT=3000
```
**Save**: Ctrl+X, Y, Enter

### 4.7 Start Application
```bash
# Make sure virtual environment is active
source venv/bin/activate

# Start with PM2
pm2 start server.js --name "voiceforge"
pm2 startup
pm2 save
```

## Step 5: Setup MongoDB Atlas (GUI)

### 5.1 Create Account
- Go to **mongodb.com/atlas**
- Click **"Try Free"**
- Sign up with Google/email

### 5.2 Create Cluster
- Choose **"M0 Sandbox"** (Free)
- Provider: **AWS**
- Region: **Same as your EC2** (e.g., us-east-1)
- Cluster Name: `voiceforge`
- Click **"Create"**

### 5.3 Create Database User
- Click **"Database Access"** in left menu
- Click **"Add New Database User"**
- Username: `voiceforge`
- Password: Generate secure password
- Role: **"Read and write to any database"**
- Click **"Add User"**

### 5.4 Whitelist IP
- Click **"Network Access"** in left menu
- Click **"Add IP Address"**
- Enter **"0.0.0.0/0"** (Allow access from anywhere)
- Description: **"Allow all IPs"**
- Click **"Confirm"**

**Note**: For production, use specific EC2 IP for better security

### 5.5 Get Connection String
- Click **"Clusters"** in left menu
- Click **"Connect"** on your cluster
- Choose **"Connect your application"**
- Copy connection string
- Replace `<password>` with your database password

## Step 6: Configure Nginx (GUI Alternative)

### 6.1 Create Config File
```bash
sudo nano /etc/nginx/sites-available/voiceforge
```

**Paste this:**
```nginx
server {
    listen 80;
    server_name YOUR-EC2-IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/voiceforge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Test Your App

1. **Open browser**
2. **Go to**: `http://YOUR-EC2-IP`
3. **Your app should load!**
4. **Test email**: SMTP will work perfectly on EC2

## Step 8: Get Domain (Optional)

### 8.1 Buy Domain
- Go to **Namecheap**, **GoDaddy**, or **Route 53**
- Buy domain (e.g., `voiceforge.com`)

### 8.2 Point Domain to EC2
- In domain DNS settings
- Add **A Record**: `@` → `YOUR-EC2-IP`
- **Note**: If `www` record conflicts, delete existing one first or skip it

### 8.3 Update Nginx for Domain
```bash
sudo nano /etc/nginx/sites-available/voiceforge
```
Change `server_name YOUR-EC2-IP;` to `server_name yourdomain.com;`

```bash
sudo systemctl restart nginx
```

### 8.4 Update Google OAuth (GUI)
1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**
3. **Go to APIs & Services > Credentials**
4. **Click your OAuth 2.0 Client ID**
5. **Add to Authorized JavaScript origins**:
   - `http://yourdomain.com`
6. **Add to Authorized redirect URIs**:
   - `http://yourdomain.com/auth/google/callback`
7. **Click Save**

### 8.5 Test Domain
- Wait 5-10 minutes for DNS propagation
- Go to `http://yourdomain.com`
- Google OAuth should now work!

### 8.6 Get SSL Certificate (Optional)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## 🎉 Done!

Your app is now live with:
- ✅ Working SMTP emails
- ✅ All features from local
- ✅ Professional domain (optional)
- ✅ SSL certificate (optional)

**Cost**: Free for 12 months, then ~$10/month

**Access your app**: `http://yourdomain.com` or `https://yourdomain.com`