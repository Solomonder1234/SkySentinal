# SkySentinel Discord Bot

Welcome to the SkyAlert Network's custom Discord Bot repository! SkySentinel is a highly advanced, multi-purpose moderation, economy, and utility bot built with Discord.js, Prisma SQLite, and TypeScript.

## 🚀 Prerequisites
Before you begin, ensure you have the following installed on your new computer or host machine:
- **Node.js**: Version 20.x or higher is required.
- **Git**: To clone the repository.
- **FFmpeg**: Required for the voice/music features (`ffmpeg-static` is included, but having the native package is recommended for Linux).

## 🛠️ Installation & Setup Guide

### 1. Clone the Repository
Open your terminal and clone the repository from GitHub:
```bash
git clone https://github.com/Solomonder1234/SkySentinal.git
cd SkySentinal
```

### 2. Install Dependencies
Install all required NPM packages:
```bash
npm install
```

### 3. Environment Configuration (.env)
Create a `.env` file in the root directory (same level as `package.json`). You can use a text editor to create this file. 

Add the following variables and replace the placeholder placeholders with your actual keys:
```env
# Discord Bot Infrastructure
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id_here

# AI Integrations
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL="file:./local.db"
```

### 4. Initialize the Database
SkySentinel uses Prisma with a local SQLite database. Run the following commands to generate the Prisma client and push the schema to create `local.db`:
```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Bot!

#### Option A: Local Development (Auto-Restarts)
If you are editing the bot code and want it to run directly from TypeScript:
```bash
npm run dev
```

#### Option B: Production (PM2 on Linux/VPS)
If you are running the bot on a 24/7 host like a VPS, you should build the TypeScript files and use PM2 to keep it alive:
```bash
# 1. Build the TypeScript files into JavaScript
npm run build

# 2. Install PM2 process manager globally (if not already installed)
npm install -g pm2

# 3. Start the bot using PM2
pm2 start npm --name "SkySentinel" -- run start

# 4. Save the PM2 process list so it automatically starts on system reboot
pm2 save
```

---

## 📝 Useful Commands
- **Stop the bot (PM2)**: `pm2 stop SkySentinel`
- **Restart the bot (PM2)**: `pm2 restart SkySentinel`
- **View live bot logs (PM2)**: `pm2 logs SkySentinel`
- **Open Prisma Studio (View Database UI)**: `npx prisma studio`
