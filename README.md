# 🚀 Deploying a Node.js Express App on an Azure VM with Nginx

This tutorial walks you through deploying an Express app on an Ubuntu VM in Microsoft Azure. We'll configure **Nginx as a reverse proxy** so your app can be accessed with just the public IP — no port number needed. You'll also set it up to auto-start and stay running.

If you have a repository with an express app running great! If not fork this repository and use it when prompted. https://github.com/JoshuaEmery/Test-API.git

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
   - **Image**: `Ubuntu Server 24.04 LTS - x64 Gen2`
   - **VM architecture**: `x64`
   - **Size**: `Standard_B1ls - 1 vcpu, 0.5 GiB memory ($3.80/month)`
   - **OS disk type**: `Standard HDD (locally-redundant storage)`
   - **Authentication type**: `SSH public key`
   - **Username**: `azureuser`
   - **SSH Key Type**: `RSA SSH Format`
   - **Generate new key pair**: Azure will automatically generate an SSH key pair for you.

   Note: The `.pem` file will be available for download after you click **Create**.

3. **Configure Inbound Ports** during VM creation:

   - Under **Networking**:
     - Allow selected ports:
       - **HTTP (80)**: for web traffic
       - **HTTPS (443)**: for SSL (future use)
       - **SSH (22)**: for connecting via terminal

   Example:

   ```
   + Inbound ports: 22, 80, 443
   ```

4. Click **Review + Create**, then **Create** the VM.

   - Note the public IP address once provisioning is done.

   - Download the `.pem` file after clicking **Create**.

---

## 🔗 Step 2: Connect to Your VM

For Linux/Mac users, set the correct permissions for your SSH key:

```bash
chmod 400 /path/to/azurekey.pem
```

Connect to the VM in your terminal

```bash
ssh -i /path/to/azurekey.pem azureuser@<your-public-ip>
```

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

We need Git to clone your app, Node.js to run it, and NPM to install dependencies. These are essential tools for managing and running your Node.js application. In linux we install applications through the command line. apt is the package manager that comes built in with ubuntu. These commands will take some time.

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

#### No we generate a secure key

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

## 🔓 Step 7: Open Ports on Ubuntu

To ensure you can connect to your VM via SSH, you need to allow SSH traffic through the firewall. This is crucial for remote management and making further changes to your server.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp
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

Running your app as a service ensures it stays running in the background and restarts automatically after a reboot. This is essential for maintaining uptime and reliability.

```bash
cd /etc/systemd/system
```

Navigate to the systemd directory where service files are stored.

```bash
sudo vi test-api.service
```

Create a new service file for your application using `vi`, a powerful text editor available in most Linux distributions.

### Using vi as a Text Editor

`vi` is a modal text editor, meaning it has different modes for different tasks. Here's a quick guide:

- **Insert Mode**: Press `i` to enter insert mode, allowing you to type text.
- **Normal Mode**: Press `Esc` to return to normal mode, where you can navigate and execute commands.
- **Save and Exit**: Type `:wq` in normal mode to save changes and exit.
- **Exit Without Saving**: Type `:q!` to exit without saving changes.

`vi` is used because it's lightweight, available by default on most systems, and powerful for editing configuration files.

Paste the following (update paths if needed):

```ini
[Unit]
Description=My Web Server
# Only launch after network service has started
After=network.target

[Service]
# Full address of your app
ExecStart=node /var/www/Test-API/server.js
Restart=always
User=nobody
# Note Debian/Ubuntu uses 'nogroup', RHEL/Fedora uses 'nobody'
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
# Set Node to production env
Environment=NODE_ENV=production
WorkingDirectory=/var/www/Test-API

[Install]
WantedBy=multi-user.target
```

Save and exit (`Esc`, `:wq`).

Reload and enable the service:

```bash
sudo systemctl daemon-reload
```

This command reloads the systemd manager configuration. It's necessary after creating or modifying service files to ensure that systemd recognizes the changes.

```bash
sudo systemctl enable test-api.service
```

This command enables the service to start automatically at boot. It creates a symbolic link in the system's startup configuration, ensuring the service runs whenever the system is restarted.

```bash
sudo systemctl start test-api.service
```

This command starts the service immediately. It runs the service based on the configuration specified in the service file.

Check status:

```bash
sudo systemctl status test-api.service
```

## 🛑 Stopping the Service

If you need to stop the service, use the following command:

```bash
sudo systemctl stop test-api.service
```

### Skip this on the first run through. This is only for applying updates to your server.js

If you need to stop the service to update it, this command will stop the service immediately, halting its execution.

To prevent it from starting at boot, you can disable it with:

```bash
sudo systemctl disable test-api.service
```

These commands are useful for managing the service's operation and ensuring it doesn't run when not needed.

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
