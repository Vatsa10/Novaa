# On-Device AI Inference Guide

## Overview

Nova now supports **on-device AI inference** using llama.cpp, allowing the mobile app to run FunctionGemma locally without requiring a backend server. This provides:

- **Privacy**: All inference happens on-device
- **Speed**: No network latency
- **Offline**: Works without internet connection
- **Cost**: No server costs

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Voice Recognition → Voice Service (Hybrid)              │
│                           ↓                              │
│                    ┌──────────────┐                      │
│                    │  AUTO MODE   │                      │
│                    └──────┬───────┘                      │
│                           │                              │
│              ┌────────────┴────────────┐                 │
│              ↓                         ↓                 │
│    ┌─────────────────┐       ┌─────────────────┐        │
│    │  On-Device      │       │  Backend API    │        │
│    │  (llama.cpp)    │       │  (FastAPI)      │        │
│    └─────────────────┘       └─────────────────┘        │
│              ↓                         ↓                 │
│       FunctionGemma              FunctionGemma           │
│       (Local GGUF)               (Ollama)                │
└─────────────────────────────────────────────────────────┘
```

## Implementation Files

### Core Engine (`services/llamaEngine.ts`)
- TypeScript wrapper for llama.cpp
- Manages model loading/unloading
- Handles tokenization and inference
- Parses FunctionGemma responses

### Voice Service (`services/voiceService.ts`)
- **Hybrid inference** with automatic fallback
- Three modes:
  - `ON_DEVICE`: Local only
  - `BACKEND`: Remote only
  - `AUTO`: Try local, fallback to remote

### Settings UI (`app/(tabs)/settings.tsx`)
- Model management interface
- Mode selection
- Status monitoring

## Setup Instructions

### Option 1: Using llama.rn (Recommended)

1. **Install the package**:
   ```bash
   npm install llama.rn
   ```

2. **Create development build**:
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS
   npx expo run:ios
   ```

3. **Download FunctionGemma GGUF**:
   - Visit [Hugging Face](https://huggingface.co/google/functiongemma-270m-it-GGUF)
   - Download `functiongemma-270m-it-Q4_K_M.gguf` (~150MB)

4. **Transfer to device**:
   - **Android**: Use ADB or file manager
   - **iOS**: Use Files app or iTunes

5. **Load in app**:
   - Open Settings tab
   - Tap "Load Model"
   - Select the .gguf file
   - Wait for loading (10-30 seconds)

### Option 2: Using llama.cpp WASM (Web Only)

For web platform, you can use the WebAssembly build:

```bash
npm install @llama-node/llama-cpp
```

This is automatically handled by the engine when running on web.

## Usage

### Automatic Mode (Default)

```typescript
import { parseVoiceCommand } from '@/services/voiceService';

// Will try on-device first, fallback to backend
const result = await parseVoiceCommand("open google");
console.log(result); // { name: "open_browser", parameters: { url: "google" } }
```

### Force On-Device

```typescript
import { setInferenceMode, InferenceMode } from '@/services/voiceService';

setInferenceMode(InferenceMode.ON_DEVICE);
```

### Force Backend

```typescript
setInferenceMode(InferenceMode.BACKEND);
```

### Initialize On-Device

```typescript
import { initializeOnDeviceInference } from '@/services/voiceService';

const modelPath = '/path/to/functiongemma-270m-it-Q4_K_M.gguf';
const success = await initializeOnDeviceInference(modelPath);

if (success) {
  console.log('On-device inference ready!');
}
```

## Model Configuration

The engine uses optimized settings for mobile:

```typescript
{
  n_gpu_layers: 99,      // Use Metal/GPU acceleration
  n_ctx: 2048,           // Context window
  n_batch: 512,          // Batch size
  n_threads: 4,          // CPU threads
  temperature: 0.0,      // Greedy sampling (deterministic)
}
```

## Performance

### Model Size
- **Q4_K_M**: ~150MB (recommended)
- **Q5_K_M**: ~180MB (higher quality)
- **Q8_0**: ~270MB (best quality)

### Inference Speed
- **iPhone 12+**: ~50-100 tokens/sec
- **Android (Snapdragon 8+)**: ~40-80 tokens/sec
- **Older devices**: ~20-40 tokens/sec

### Memory Usage
- **Model**: ~200-300MB RAM
- **Context**: ~50-100MB RAM
- **Total**: ~300-400MB RAM

## Troubleshooting

### "Model not loaded" error

**Solution**: Make sure you've called `initializeOnDeviceInference()` and it returned `true`.

### "llama.rn not installed" warning

**Solution**: Install the package and rebuild:
```bash
npm install llama.rn
npx expo prebuild
npx expo run:android  # or run:ios
```

### Slow inference on device

**Solutions**:
1. Use a smaller quantization (Q4_K_M instead of Q8_0)
2. Reduce `n_ctx` to 1024
3. Ensure GPU acceleration is enabled (`n_gpu_layers: 99`)

### Out of memory crashes

**Solutions**:
1. Use Q4_K_M quantization
2. Reduce `n_ctx` to 1024 or 512
3. Close other apps
4. Use backend mode for low-memory devices

## Comparison: On-Device vs Backend

| Feature | On-Device | Backend |
|---------|-----------|---------|
| **Speed** | Fast (no network) | Depends on network |
| **Privacy** | 100% private | Data sent to server |
| **Offline** | ✅ Works offline | ❌ Requires internet |
| **Setup** | Complex (model download) | Simple |
| **Memory** | ~300-400MB | Minimal |
| **Battery** | Higher usage | Lower usage |
| **Quality** | Same as backend | Same as on-device |

## Best Practices

1. **Use AUTO mode** for best user experience
2. **Preload model** on app startup if available
3. **Show loading indicators** during inference
4. **Handle errors gracefully** with fallback
5. **Monitor memory usage** on low-end devices
6. **Cache results** for repeated commands

## Future Enhancements

- [ ] Model quantization options in UI
- [ ] Inference speed benchmarking
- [ ] Model download from Hugging Face
- [ ] Multiple model support
- [ ] Context caching for faster responses
- [ ] Streaming token generation

## References

- [llama.cpp](https://github.com/ggerganov/llama.cpp)
- [llama.rn](https://github.com/mybigday/llama.rn)
- [FunctionGemma](https://huggingface.co/google/functiongemma-270m-it)
- [GGUF Format](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)
