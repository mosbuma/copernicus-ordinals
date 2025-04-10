#!/bin/bash

# Exit on error
set -e

echo "🏗️ Building Next.js application..."
bun run build

echo "📦 Creating deployment archive..."
if [ -f "bun.lockb" ]; then
  tar -czf dist.tar.gz .next package.json bun.lockb public
else
  tar -czf dist.tar.gz .next package.json package-lock.json public
fi

echo "📤 Transferring to Raspberry Pi..."
ssh copernicus@copernicus.local 'mkdir -p ~/app'
scp dist.tar.gz copernicus@copernicus.local:~/app/dist.tar.gz

echo "🔑 Copying environment file..."
if [ -f ".env" ]; then
  scp .env copernicus@copernicus.local:~/app/.env
else
  echo "Warning: No .env file found"
fi

echo "💾 Setting up swap file on Raspberry Pi..."
ssh copernicus@copernicus.local '
  # Check if swap is already enabled
  if [ "$(sudo swapon --show | wc -l)" -eq "0" ]; then
    echo "Creating and enabling 2GB swap file..."
    # Create a 2GB swap file
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    # Make swap permanent
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
    echo "Swap file created and enabled"
  else
    echo "Swap is already enabled, skipping..."
  fi
'

echo "🔧 Setting up Node.js environment on Raspberry Pi..."
ssh copernicus@copernicus.local '
  # Install NVM if not present
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  
  # Load NVM
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  
  # Install LTS Node.js if not present
  if ! command -v node &> /dev/null; then
    nvm install --lts
    nvm use --lts
  fi
  
  # Install PM2 globally if not present
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi
'

echo "🚀 Deploying on Raspberry Pi..."
ssh copernicus@copernicus.local '
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  cd ~/app && \
  
  # Preserve existing node_modules
  if [ -d "node_modules" ]; then
    mv node_modules node_modules_old
  fi
  
  # Extract new files
  tar xzf dist.tar.gz && \
  rm dist.tar.gz && \
  
  # Check if package.json changed
  if [ -f "package.json" ] && [ -d "node_modules_old" ]; then
    if diff package.json node_modules_old/../package.json >/dev/null 2>&1; then
      echo "📦 No changes in package.json, reusing node_modules" && \
      mv node_modules_old node_modules
    else
      echo "📦 Changes detected in package.json, installing dependencies" && \
      rm -rf node_modules_old && \
      npm install --production
    fi
  else
    echo "📦 Fresh install of dependencies" && \
    rm -rf node_modules_old && \
    npm install --production
  fi && \
  
  # Stop any existing instance
  pm2 stop next-app 2>/dev/null || true && \
  pm2 delete next-app 2>/dev/null || true && \
  # Start with proper logging and port config
  NODE_ENV=production PORT=3000 pm2 start "npm start" \
    --name "next-app" \
    --log "./pm2.log" \
    --time \
    --exp-backoff-restart-delay=100 \
    --env production
'

echo "🧹 Cleaning up local files..."
rm dist.tar.gz

echo "✅ Deployment complete!"
echo "📝 To check logs on the Raspberry Pi, run:"
echo "   ssh copernicus@copernicus.local 'tail -f ~/app/pm2.log'" 