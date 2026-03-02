#!/bin/bash
# Expand memory so `dnf` prevents OOM limits
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Safely run install
sudo dnf clean all
sudo dnf install nginx -y

# Configure traffic handling
sudo systemctl enable --now nginx
sudo mkdir -p /usr/share/nginx/html/
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r /home/opc/website/* /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html
sudo chown -R nginx:nginx /usr/share/nginx/html

# Expose port
sudo firewall-cmd --zone=public --permanent --add-service=http
sudo firewall-cmd --zone=public --permanent --add-service=https
sudo firewall-cmd --reload
