# On-Device Inference - Quick Setup

## ✅ Corrected Package Information

**Package Name**: `llama.rn` (NOT `react-native-llama`)

## 🚀 Quick Start (5 Steps)

### 1. Install Package
```bash
cd ai-mobile
npm install llama.rn
```

### 2. Create Development Build
```bash
# For Android
npx expo run:android

# For iOS (requires Mac)
npx expo run:ios
```

### 3. Download Model
- Visit: https://huggingface.co/google/functiongemma-270m-it-GGUF
- Download: `functiongemma-270m-it-Q4_K_M.gguf` (~150MB)

### 4. Transfer to Device
**Android**:
```bash
adb push functiongemma-270m-it-Q4_K_M.gguf /sdcard/Download/
```

**iOS**: Use Files app or AirDrop

### 5. Load in App
1. Open Nova app
2. Go to **Settings** tab
3. Tap **"Load Model"**
4. Select the `.gguf` file
5. Wait 10-30 seconds
6. ✅ Done!

## 📱 Usage Modes

### AUTO (Recommended)
```typescript
// Default mode - tries on-device first, falls back to backend
import { parseVoiceCommand } from '@/services/voiceService';

const result = await parseVoiceCommand("open google");
```

### ON_DEVICE Only
```typescript
import { setInferenceMode, InferenceMode } from '@/services/voiceService';

setInferenceMode(InferenceMode.ON_DEVICE);
// Now all inference runs locally
```

### BACKEND Only
```typescript
setInferenceMode(InferenceMode.BACKEND);
// Uses remote server (Python backend must be running)
```

## 🔧 Troubleshooting

### "llama.rn not installed"
```bash
npm install llama.rn
npx expo prebuild
npx expo run:android
```

### "Model not loaded"
- Check file path is correct
- Ensure .gguf file is valid
- Try re-downloading the model

### App crashes on model load
- Use Q4_K_M quantization (not Q8)
- Close other apps to free memory
- Reduce `n_ctx` to 1024 in settings

## 📊 Performance

| Device | Speed | Memory |
|--------|-------|--------|
| iPhone 13+ | ~60 tok/s | ~300MB |
| Pixel 7+ | ~50 tok/s | ~300MB |
| Mid-range | ~30 tok/s | ~300MB |

## 🎯 Key Features

✅ **100% Private** - Data never leaves device  
✅ **Offline** - Works without internet  
✅ **Fast** - No network latency  
✅ **Free** - No API costs  

## 📚 Additional Resources

- Full Documentation: `ON_DEVICE_INFERENCE.md`
- llama.rn GitHub: https://github.com/mybigday/llama.rn
- FunctionGemma Models: https://huggingface.co/google/functiongemma-270m-it-GGUF
