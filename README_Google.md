# 🚀 Deploying a Node.js Express App on Google Cloud VM with Nginx

This tutorial walks you through deploying an Express app on an Ubuntu VM in Google Cloud Platform. We'll configure **Nginx as a reverse proxy** so your app can be accessed with just the public IP — no port number needed. You'll also set it up to auto-start and stay running.

If you have a repository with an express app running great! If not fork this repository and use it when prompted. https://github.com/JoshuaEmery/Test-API.git

---

## 🧰 Prerequisites

- Google Cloud account (with free tier credits)
- GitHub account with a Node.js/Express app
- Basic Linux command-line familiarity

---

## 🖥️ Step 1: Create a Google Cloud VM (Ubuntu)

### Why?

You need a Linux server in the cloud to run your backend app and make it reachable from the web.

### Steps:

1. **Login to Google Cloud Console**:
   [https://console.cloud.google.com](https://console.cloud.google.com)

2. **Create Virtual Machine**:

   - Go to **Compute Engine > VM instances > Create Instance**
   - **Name**: `test-express` (or your preferred name)
   - **Region**: `us-west1` (Oregon) - good for free tier
   - **Zone**: `us-west1-c`
   - **Machine Configuration**:
     - **Machine family**: `General-purpose`
     - **Series**: `E2`
     - **Machine type**: `e2-micro (2 vCPU, 1 GB memory)` - **Free tier eligible**
   - **Boot disk**:
     - Click **Change**
     - **Operating system**: Ubuntu
     - **Version**: Ubuntu 24.04 LTS (x86/64, amd64 plucky image)
     - **Boot disk type**: `Standard persistent disk` - **Free tier eligible**
     - **Size**: 10 GB (free tier includes up to 30 GB)
   - **Firewall**:
     - ✅ **Allow HTTP traffic** (enables port 80)
     - ✅ **Allow HTTPS traffic** (enables port 443)

3. Click **Create** to provision the VM.

   - Note the **External IP address** once the VM is running.

---

## 🔗 Step 2: Connect to Your VM

Google Cloud provides an in-browser SSH client, so no need to download keys!

1. **In the VM instances page**, click the **SSH** button next to your VM
2. This opens a browser-based terminal connected to your VM
3. You'll be logged in as your Google account username

### Understanding Linux Folder Structure and Navigation

Once connected, you'll be in the home directory of the user. Here's a brief overview of the Linux folder structure:

- `/`: The root directory, the top level of the filesystem.
- `/home`: Contains personal directories for users.
- `/var`: Used for variable data like logs and web files.
- `/etc`: Contains configuration files for the system.
- `/usr`: Contains user-installed software and libraries.

Basic navigation commands:

- `pwd`: Print the current working directory.
- `cd <directory>`: Change to the specified directory.
- `ls`: List files and directories in the current directory.

These commands will help you move around and understand the structure of your Linux environment.

Create a `www` folder in `/var` to host your web applications. This is a common practice to keep web files organized and separate from system files. The `/var` directory is typically used for variable data files, and `www` is a standard location for web content.

```bash
cd /var
sudo mkdir www
```

## 🔧 Step 3: Install Required Software

### Why?

We need to install essential tools that don't come with the minimal Ubuntu image. This includes text editors and firewall tools we'll need later.

```bash
sudo apt update
sudo apt install git npm vim ufw -y
```

This installs:

- **git**: To clone your repository
- **npm**: Node.js package manager
- **vim**: Text editor for configuration files
- **ufw**: Uncomplicated Firewall for security

Test each installation to ensure they are correctly installed:

```bash
git --version
npm --version
vim --version
ufw --version
```

## 📦 Step 4: Install Node.js with NVM

### Why?

NVM (Node Version Manager) lets you install and switch between different Node.js versions easily. This is useful for managing multiple projects that may require different Node.js versions.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Test with:

```bash
nvm --version
```

Use nvm to install the most recent long term support version of node

```bash
nvm install --lts
```

Test node is working

```bash
node --version
```

---

## 🔐 Step 5: Set Up Git and SSH with GitHub

### Why?

In order to connect to your github account you need to authenticate. We do not have a browser in a linux environment with no GUI. You must use SSH to authenticate with git.

#### First setup your username

```bash
git config --global user.name "Your Name"
```

```bash
git config --global user.email "your_email@example.com"
```

#### Now we generate a secure key

```bash
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

#### If you have your own repo you would like to deploy, clone it. If not, you can use the repo you forked at the beginning from here: https://github.com/JoshuaEmery/Test-API.git

This step involves cloning your application repository to the server and installing its dependencies. This is crucial for setting up your application environment on the server.

```bash
cd /var/www
```

Navigate to the `/var/www` directory where your web applications are stored.

```bash
sudo git clone WebAddressToYourRepository
```

Clone your repository using Git. Replace `WebAddressToYourRepository` with the actual URL of your repository.

```bash
cd Test-API
```

Change into the directory of your cloned repository.

```bash
sudo npm install
```

Install the necessary dependencies for your Node.js application using NPM.

## 🔓 Step 7: Configure Ubuntu Firewall

### Why?

Google Cloud VMs come with a basic firewall that we need to configure. We'll allow SSH (for remote access) and HTTP (for web traffic).

```bash
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

> Press `y` if warned about disrupting SSH.

**Note**: We don't need to open port 3000 because Nginx will handle routing HTTP traffic (port 80) to our Node.js app (port 3000) internally.

Check firewall status:

```bash
sudo ufw status
```

---

## ▶️ Step 8: Test Your App

Run the app manually to make sure it works:

```bash
node server.js
```

The app should start on port 3000. You can test it locally on the server:

```bash
curl http://localhost:3000
```

✅ You should see your app's HTML response.

Press `Ctrl+C` to stop the app for now.

---

## 🛠️ Step 9: Run Your App as a Service

### Why?

Running your app as a service ensures it stays running in the background and restarts automatically after a reboot. This is essential for maintaining uptime and reliability.

```bash
cd /etc/systemd/system
```

Navigate to the systemd directory where service files are stored.

```bash
sudo vim test-api.service
```

Create a new service file for your application using `vim`.

### Using vim as a Text Editor

`vim` is a powerful text editor. Here's a quick guide:

- **Insert Mode**: Press `i` to enter insert mode, allowing you to type text.
- **Normal Mode**: Press `Esc` to return to normal mode, where you can navigate and execute commands.
- **Save and Exit**: Type `:wq` in normal mode to save changes and exit.
- **Exit Without Saving**: Type `:q!` to exit without saving changes.

Press `i` to enter insert mode, then paste the following (update paths if needed):

```ini
[Unit]
Description=Test API Service
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/var/www/Test-API
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Save and exit (`Esc`, then `:wq`).

Reload and enable the service:

```bash
sudo systemctl daemon-reload
```

This command reloads the systemd manager configuration. It's necessary after creating or modifying service files to ensure that systemd recognizes the changes.

```bash
sudo systemctl enable test-api.service
```

This command enables the service to start automatically at boot.

```bash
sudo systemctl start test-api.service
```

This command starts the service immediately.

Check status:

```bash
sudo systemctl status test-api.service
```

You should see `Active: active (running)`.

## 🛑 Stopping the Service - Skip this step on the first run through. This is for when you need to deploy changes

If you need to stop the service, use the following command:

```bash
sudo systemctl stop test-api.service
```

To prevent it from starting at boot, you can disable it with:

```bash
sudo systemctl disable test-api.service
```

These commands are useful for managing the service's operation during updates and maintenance.

---

## 🔁 Step 10: Install and Configure Nginx as Reverse Proxy

### Why?

Browsers use port `80` for HTTP by default. Nginx forwards requests from `http://your-ip` to `http://localhost:3000`. This means users can access your app without needing to specify a port number, providing a cleaner URL and improving user experience.

Install Nginx:

```bash
sudo apt install nginx -y
```

Create a new site config:

```bash
sudo vim /etc/nginx/sites-available/test-api
```

Press `i` to enter insert mode, then paste:

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit (`Esc`, then `:wq`).

This Nginx configuration sets up a reverse proxy:

- **listen 80;**: Listens on port 80, the default HTTP port.
- **server*name *;**: Matches any server name.
- **location /**: Defines the behavior for requests to the root URL.
- **proxy_pass http://localhost:3000;**: Forwards requests to the app running on port 3000.

Disable default Nginx site and enable yours:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/test-api /etc/nginx/sites-enabled/
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Step 11: Visit Your App on Port 80

Now you can visit your app using just the external IP address:

```
http://<your-external-ip>
```

No `:3000` needed! 🎉

You can find your external IP in the Google Cloud Console under VM instances.

---

## 🧼 Step 12: Fix Git Permission Issues (Optional)

If you see `dubious ownership` errors when pulling updates:

```bash
git config --global --add safe.directory /var/www/Test-API
sudo chown -R $(whoami):$(whoami) /var/www/Test-API
```

---

## 🔄 Step 13: Deploying Updates

When you want to deploy changes from your repository:

1. **Stop the service**:

   ```bash
   sudo systemctl stop test-api.service
   ```

2. **Pull changes**:

   ```bash
   cd /var/www/Test-API
   git pull origin main
   ```

3. **Install new dependencies** (if package.json changed):

   ```bash
   sudo npm install
   ```

4. **Start the service**:

   ```bash
   sudo systemctl start test-api.service
   ```

5. **Check status**:
   ```bash
   sudo systemctl status test-api.service
   ```

---

## 🎉 Congratulations!

Your Node.js Express app is now running on Google Cloud with:

- ✅ **Automatic startup** on boot
- ✅ **Nginx reverse proxy** for clean URLs
- ✅ **Firewall configured** for security
- ✅ **Free tier eligible** configuration
- ✅ **Easy deployment** workflow for updates

Your app is accessible at `http://<your-external-ip>` and will stay running even if you close your browser or lose connection to the server.

---

## 💡 Pro Tips

- **Monitor your app**: Use `sudo journalctl -u test-api.service -f` to watch logs
- **Check resource usage**: Use `htop` (install with `sudo apt install htop`)
- **Free tier limits**: Monitor your usage in the Google Cloud Console
- **Security**: Consider setting up SSL certificates with Let's Encrypt for HTTPS
