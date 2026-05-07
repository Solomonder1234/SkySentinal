#!/bin/bash
cd /Users/leobernstein/Desktop/Fur-Bot
source venv/bin/activate
nohup python bot.py > bot.log 2>&1 &
echo "Bot started in background"
