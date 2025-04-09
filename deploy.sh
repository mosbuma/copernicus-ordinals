#!/bin/bash

# Build the project
echo "Building the project..."
bun run build

# Create a deployment package
echo "Creating deployment package..."
mkdir -p deploy
cp -r .next deploy/
cp -r public deploy/
cp package.json deploy/
cp bun.lock deploy/
cp next.config.ts deploy/

# Create a start script
echo "Creating start script..."
cat > deploy/start.sh << 'EOL'
#!/bin/bash
export NODE_ENV=production
bun start
EOL
chmod +x deploy/start.sh

echo "Deployment package created in 'deploy' directory"
echo "To deploy to Raspberry Pi:"
echo "1. Copy the 'deploy' directory to your Raspberry Pi"
echo "2. On the Raspberry Pi, run:"
echo "   cd deploy"
echo "   bun install"
echo "   ./start.sh" 