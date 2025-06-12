# 🚀 Deploying a Node.js Express App on an Azure VM with Nginx

This tutorial walks you through deploying an Express app on an Ubuntu VM in Microsoft Azure. We'll configure **Nginx as a reverse proxy** so your app can be accessed with just the public IP — no port number needed. You'll also set it up to auto-start and stay running.

---

## 🧰 Prerequisites

- Azure account
- GitHub account with a Node.js/Express app
- SSH client (Linux/Mac Terminal or PuTTY for Windows)
- Basic Linux command-line familiarity

---

## 🖥️ Step 1: Create an Azure VM (Ubuntu)

### Why?

You need a Linux server in the cloud to run your backend app and make it reachable from the web.

### Steps:

1. **Login to Azure Portal**:
   [https://portal.azure.com](https://portal.azure.com)

2. **Create Virtual Machine**:

   - Go to **Virtual Machines > + Create**
   - **Image**: `Ubuntu 22.04 LTS`
   - **Username**: `azureuser` ✅
   - **Authentication type**: `SSH public key`
   - Click **Generate new key pair**

     - Name it `azurekey`
     - **Download the `.pem` file**

3. **Configure Inbound Ports** during VM creation:

   - Under **Networking**:

     - ✅ Add the following ports:

       - **SSH (22)**: for connecting via terminal
       - **HTTP (80)**: for web traffic
       - **HTTPS (443)**: for SSL (future use)
       - **Custom (3000)**: for initial Express testing

   Example:

   ```
   + Inbound ports: 22, 80, 443, 3000
   ```

4. Click **Review + Create**, then **Create** the VM.

   - Note the public IP address once provisioning is done.

---

## 🔗 Step 2: Connect to Your VM

```bash
chmod 400 /path/to/azurekey.pem
ssh -i /path/to/azurekey.pem azureuser@<your-public-ip>
```

Create a `www` folder in `/var` to host your web applications. This is a common practice to keep web files organized and separate from system files. The `/var` directory is typically used for variable data files, and `www` is a standard location for web content.

```bash
mkdir -p /var/www
```

## 🔧 Step 3: Install Required Software

### Why?

We need Git to clone your app, Node.js to run it, and NPM to install dependencies. These are essential tools for managing and running your Node.js application.

```bash
sudo apt update
sudo apt install git -y
sudo apt install npm -y
```

Test each installation to ensure they are correctly installed:

```bash
git --version
npm --version
```

## 📦 Step 4: Install Node.js with NVM

### Why?

NVM (Node Version Manager) lets you install and switch between different Node.js versions easily. This is useful for managing multiple projects that may require different Node.js versions.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install --lts
```

Test with:

```bash
nvm --version
```

---

## 🔐 Step 5: Set Up Git and SSH with GitHub

### Why?

SSH allows secure and password-less communication between your server and GitHub for cloning private or public repos.

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@example.com"
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Accept the default path.
- Use no passphrase for simplicity.
- View the key:

```bash
cat ~/.ssh/id_ed25519.pub
```

- Copy the output and paste it into GitHub:

  - **Settings > SSH and GPG Keys > New SSH Key**

Test the connection:

```bash
ssh -T git@github.com
```

---

## 📁 Step 6: Clone Your App and Install Dependencies

```bash
cd /var/www
sudo git clone git@github.com:YourUsername/Test-API.git
cd Test-API
sudo npm install
```

---

## 🔓 Step 7: Open Ports on Ubuntu

```bash
sudo ufw allow 3000/tcp
sudo ufw enable
```

> Press `y` if warned about disrupting SSH.

---

## 🌐 Step 8: Open Ports on Azure

1. Go to **VM > Networking > Add inbound port rule**
2. Add rules for:

   - **Port 3000** (your app port)

3. Use **TCP** protocol and click **Add**

---

## ▶️ Step 9: Test Your App

Run the app manually:

```bash
node server.js
```

Visit: `http://<your-public-ip>:3000`
✅ You should see your app running.

---

## 🛠️ Step 10: Run Your App as a Service

### Why?

A systemd service keeps your app running in the background and starts it automatically after a reboot.

```bash
cd /etc/systemd/system
sudo vi test-api.service
```

Paste the following (update paths if needed):

```ini
[Unit]
Description=My Express App
After=network.target

[Service]
ExecStart=/usr/bin/node /var/www/Test-API/server.js
Restart=always
User=nobody
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/var/www/Test-API

[Install]
WantedBy=multi-user.target
```

Save and exit (`Esc`, `:wq`).

Reload and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable test-api.service
sudo systemctl start test-api.service
```

Check status:

```bash
sudo systemctl status test-api.service
```

---

## 🔁 Step 11: Install and Configure Nginx as Reverse Proxy

### Why?

Browsers use port `80` for HTTP by default. Nginx forwards requests from `http://your-ip` to `http://localhost:3000`. This means users can access your app without needing to specify a port number, providing a cleaner URL and improving user experience. Nginx also handles incoming traffic efficiently and can serve as a load balancer if needed.

Install Nginx:

```bash
sudo apt install nginx -y
```

Create a new site config:

```bash
sudo vi /etc/nginx/sites-available/test-api
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/test-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

(Optional) Disable default Nginx site:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

---

## ✅ Step 12: Visit Your App on Port 80

Now you can visit:

```
http://<your-public-ip>
```

No `:3000` needed! 🎉

---

## 🧼 Step 13: Fix Git Permission Issues (Optional)

If you see `dubious ownership` errors when pulling:

```bash
git config --global --add safe.directory /var/www/Test-API
sudo chown -R azureuser:azureuser /var/www/Test-API
git pull
```
