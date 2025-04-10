This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Installing Bun on Raspberry Pi

### Prerequisites

- Raspberry Pi running Raspberry Pi OS (64-bit recommended)
- Basic knowledge of Linux commands
- Internet connection

### Installation Steps

1. Update your system packages:

```bash
sudo apt update && sudo apt upgrade -y
```

2. Install required dependencies:

```bash
sudo apt install -y curl unzip
```

3. Install Bun using the official installer:

```bash
curl -fsSL https://bun.sh/install | bash
```

4. Add Bun to your PATH by adding this line to your `~/.bashrc` or `~/.zshrc`:

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

5. Reload your shell configuration:

```bash
source ~/.bashrc  # or source ~/.zshrc if using zsh
```

6. Verify the installation:

```bash
bun --version
```

### Troubleshooting

- If you encounter any issues with the installation, make sure you're using a 64-bit version of Raspberry Pi OS
- For ARM32 systems, you might need to build Bun from source (not recommended for beginners)
- Ensure you have enough disk space (at least 1GB free)

## Deployment to Raspberry Pi

### Prerequisites

- Raspberry Pi with Bun installed (see above)
- Node.js and npm installed on your development machine

### Deployment Steps

1. Build and prepare the deployment package:

```bash
./deploy.sh
```

2. Copy the `deploy` directory to your Raspberry Pi using scp or your preferred method:

```bash
scp -r deploy/ pi@your-raspberry-pi-ip:/path/to/destination
```

3. On the Raspberry Pi:

```bash
cd /path/to/deploy
bun install
./start.sh
```

The application will be available at `http://your-raspberry-pi-ip:3000`

# launch script Copernicus II

## coding before installation

- set final destination address in .env file
- add input box for sats/vbyte + link to mempool (open in new window).
- add confirm inscribe job dialog that shows
  - ordinal #1 (filled in)
  - number of ordinals to create
  - destination address (first, last bytes of hash)
- wifi indicator
- cleanup layout
- shutdown button!
- deploy to raspberry pi
- auto startup at boot raspberry pi

## pre-event actions

- deploy last version to raspberry pi
- setup raspberry pi to use gallery wifi
- check destination address
- run single launch in test mode

//

please fill in this component the following fields:

- input is a CreateOrderReq type record with settings
- ordinal #1 (filled in, shown as image, found in files[0])
- destination address for the ordinals (abbreviated hash or receiveaddress)
- number of ordinals to create (count of files)
- outputvalue
- devaddress
- devFee
- fee setup: select with 1/2/3/4/5 sat/VB, default is current value, can adjust the value
- button abort -> closes the dialog
- button launch -> calls onLaunchJob handler with the adjusted data


