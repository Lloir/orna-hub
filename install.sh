#!/bin/bash

# Function to install Redis
install_redis() {
    if ! command -v redis-server &> /dev/null; then
        echo "Redis not found. Installing Redis..."
        sudo apt-get update
        sudo apt-get install -y redis-server
        sudo systemctl enable redis-server.service
    else
        echo "Redis is already installed."
    fi
}

# Check and Install Node.js and npm
install_node() {
    if ! command -v node &> /dev/null; then
        echo "Node.js not found. Installing Node.js..."
        sudo apt-get update
        sudo apt-get install -y nodejs
    fi

    if ! command -v npm &> /dev/null; then
        echo "npm not found. Installing npm..."
        sudo apt-get install -y npm
    fi
}

# Function to configure Redis and hCaptcha in config.json
configure_application() {
    echo "Configuring the application..."

    # Prompt for Redis configuration
    echo -n "Enter Redis host (default: localhost): "
    read -r redis_host
    redis_host=${redis_host:-localhost}

    echo -n "Enter Redis port (default: 6379): "
    read -r redis_port
    redis_port=${redis_port:-6379}

    echo -n "Enter hCaptcha secret key: "
    read -r hcaptcha_secret_key

    # Create or update config.json
    CONFIG_FILE="config.json"
    echo "Updating $CONFIG_FILE with Redis and hCaptcha details..."
    echo "{
      \"redis\": {
        \"host\": \"$redis_host\",
        \"port\": \"$redis_port\"
      },
      \"hcaptcha\": {
        \"secretKey\": \"$hcaptcha_secret_key\"
      }
    }" > $CONFIG_FILE

    # Set file permissions to read-only for the user
    chmod 600 $CONFIG_FILE
}

# Install Redis, Node.js, and npm
install_redis
install_node

# Install Node modules
echo "Installing Node.js modules..."
npm install

# Configure application settings
configure_application

echo "Installation and configuration complete."
