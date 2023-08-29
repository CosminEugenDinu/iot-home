# IoT Online-Server

## Initial setup

```bash
# configure current user, ssh
```

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
sudo reboot
```

## Nginx

```bash
sudo apt update
sudo apt install nginx
```

```bash
sudo ufw app list
```

```bash
# test nginx is on
curl -4 example.com
```

## Setup SSL

```bash
sudo apt install certbot python3-certbot-nginx
```

```bash
sudo ufw allow 'Nginx HTTPS'
sudo ufw delete allow 'Nginx HTTP'
```

```bash
sudo ufw status
```

## Obtaining an SSL Certificate

```bash
sudo certbot --nginx -d example.com
```

## Install Docker

```bash
sudo apt update
```

```bash
sudo apt install apt-transport-https ca-certificates curl software-properties-common gnupg
```

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

```bash
sudo add-apt-repository "deb [arch="$(dpkg --print-architecture)"] https://download.docker.com/linux/ubuntu \
"$(. /etc/os-release && echo "$VERSION_CODENAME")" stable"
```

```bash
sudo apt update
```

```bash
apt-cache policy docker-ce
```

```bash
sudo apt install docker-ce
```

```bash
sudo systemctl status docker
```

## Docker sudo group

```bash
sudo usermod -aG docker "${USER}"
```

```bash
su - "${USER}"
```

```bash
sudo usermod -aG docker "${USER}"
```

## Docker hub login

```bash
docker login
```

## Install Node.js

```bach
cd ~
curl -sL https://deb.nodesource.com/setup_18.x -o /tmp/nodesource_setup.sh
```

```bash
sudo bash /tmp/nodesource_setup.sh
```

```bash
sudo apt install nodejs
```
