#!/bin/bash
cd ~/SkyAlertBot

# Install Node 20
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs -y
sudo dnf install npm -y

# Safely execute Prisma Generation, schema sync, and build dependencies
npm ci || npm install
npx prisma db push
npx prisma generate

# Compile TypeScript
npm run build

# Install PM2 globally if missing
sudo npm install -g pm2

# Boot daemon
pm2 delete SkyAlertBot || true
pm2 start npm --name "SkyAlertBot" -- run start
pm2 save
