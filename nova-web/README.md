# Nova Browser Assistant - Web App

A Progressive Web App (PWA) featuring voice-controlled browsing powered by FunctionGemma and Ollama.

## Features

- **Voice Commands** - Control your browser using natural language
- **Local AI** - Powered by FunctionGemma via Ollama (runs locally)
- **Privacy First** - All AI processing happens on your machine
- **PWA** - Installable on any device (iPhone, Android, Desktop)
- **Cross-Platform** - Works on any modern browser
- **No Build Complexity** - Simple web app, no mobile builds needed

## Quick Start

### Prerequisites

1. **Node.js 18+**
2. **Ollama** - Download from [ollama.ai](https://ollama.ai)

### Installation

```bash
# 1. Install dependencies
cd nova-web
npm install

# 2. Install Ollama (if not already installed)
# Download from https://ollama.ai

# 3. Pull FunctionGemma model
ollama pull functiongemma

# 4. Start Ollama (it should start automatically, but verify)
ollama serve

# 5. Start the development server
npm run dev
```

### Access the App

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### On Desktop

1. Open the app in Chrome or Edge
2. Click "Launch Voice Browser"
3. Click the microphone icon
4. Say a command: "open google"

### On iPhone

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Open the installed app
5. Use voice commands!

### On Android

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Install app" or "Add to Home Screen"
4. Open the installed app
5. Use voice commands!

## Voice Commands

| Command | Action |
|---------|--------|
| "open google" | Navigate to google.com |
| "search for cats" | Google search for "cats" |
| "go back" | Browser back |
| "go forward" | Browser forward |
| "refresh page" | Reload page |

## Architecture

```
Browser (Client)
    ↓
Web Speech API (Voice Recognition)
    ↓
Next.js API Route (/api/parse-command)
    ↓
Ollama (Local)
    ↓
FunctionGemma Model
    ↓
Function Call (JSON)
    ↓
Browser Action
```

## Project Structure

```
nova-web/
├── app/
│   ├── api/
│   │   └── parse-command/
│   │       └── route.ts          # Ollama integration
│   ├── browser/
│   │   └── page.tsx              # Voice browser component
│   ├── layout.tsx                # Root layout with PWA metadata
│   └── page.tsx                  # Home page
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/                    # App icons
├── next.config.js                # Next.js config with PWA
└── package.json
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Note**: You'll need to run Ollama locally. For production, consider:
- Self-hosting with Ollama on the same server
- Using a cloud GPU service for Ollama
- Deploying on a VPS with Ollama installed

### Self-Hosted

```bash
# Build the app
npm run build

# Start with PM2 (process manager)
pm2 start npm --name "nova-web" -- start

# Or use Docker
docker build -t nova-web .
docker run -p 3000:3000 nova-web
```

## Environment Variables

Create `.env.local`:

```env
OLLAMA_HOST=http://localhost:11434
```

## Browser Compatibility

| Browser | Voice Recognition | PWA Install |
|---------|------------------|-------------|
| Chrome (Desktop) | ✅ Yes | ✅ Yes |
| Chrome (Android) | ✅ Yes | ✅ Yes |
| Safari (iOS) | ✅ Yes | ✅ Yes |
| Edge | ✅ Yes | ✅ Yes |
| Firefox | ❌ No | ⚠️ Limited |

## Troubleshooting

### "Ollama is not running"

```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434
```

### "Speech recognition not supported"

Use Chrome, Edge, or Safari. Firefox doesn't support Web Speech API.

### "Model not found"

```bash
# Pull the model
ollama pull functiongemma

# Verify it's available
ollama list
```

### PWA not installing

- Use HTTPS (required for PWA)
- In development, localhost works
- For production, use a proper SSL certificate

## Performance

- **First Load**: ~1-2 seconds
- **Voice Command Processing**: ~500ms-1s
- **Model Inference**: ~200-500ms (depends on hardware)

## Advantages Over Mobile App

| Aspect | Web App (PWA) | Mobile App |
|--------|--------------|------------|
| **Installation** | Instant | App Store approval |
| **Updates** | Instant | App Store review |
| **Development** | Simple | Complex (Xcode, etc.) |
| **Cross-Platform** | One codebase | Multiple builds |
| **Distribution** | URL | App stores |
| **Maintenance** | Easy | Complex |

## License

MIT

## Support

- **Issues**: [GitHub Issues](https://github.com/Vatsa10/Novaa/issues)
- **Ollama Docs**: [ollama.ai/docs](https://ollama.ai/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
