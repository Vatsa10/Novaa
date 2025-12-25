# Bundling FunctionGemma Model with Your App

This guide shows how to bundle the FunctionGemma model directly in your app, so users don't need to manually download it.

## Benefits

✅ **Better UX** - Model loads automatically on first launch  
✅ **No manual steps** - Users don't download/transfer files  
✅ **Offline-ready** - Works immediately without internet  
✅ **Simpler deployment** - One-step installation  

## Quick Start

### Step 1: Download the Model

**Windows (PowerShell)**:
```powershell
.\download-model.ps1
```

**macOS/Linux (Bash)**:
```bash
chmod +x download-model.sh
./download-model.sh
```

**Manual Download**:
```bash
pip install huggingface_hub
huggingface-cli download ggml-org/functiongemma-270m-it-GGUF \
    functiongemma-270m-it-Q4_K_M.gguf \
    --local-dir ./ai-mobile/assets/models
```

### Step 2: Verify Model Location

The model should be at:
```
ai-mobile/
  └── assets/
      └── models/
          └── functiongemma-270m-it-Q4_K_M.gguf  (~150MB)
```

### Step 3: Build the App

**Android**:
```bash
cd ai-mobile
npx expo prebuild
npx expo run:android
```

**iOS** (requires Mac):
```bash
cd ai-mobile
npx expo prebuild
npx expo run:ios
```

### Step 4: Test

1. Launch the app
2. Check console logs for: `✅ On-device inference ready!`
3. Go to Browser tab
4. Use voice command: "open google"
5. Should work without backend!

## How It Works

### Auto-Initialization Flow

```
App Startup (_layout.tsx)
    ↓
autoInitializeOnDevice()
    ↓
tryLoadBundledModel()
    ↓
getBundledModelPath()
    ↓
┌─────────────────────────────┐
│ Android:                    │
│ file:///android_asset/      │
│   models/model.gguf         │
│                             │
│ iOS:                        │
│ model.gguf                  │
│ (from app bundle)           │
└─────────────────────────────┘
    ↓
llama.rn loads model
    ↓
✅ On-device inference ready!
```

### Code Changes Made

1. **llamaEngine.ts**:
   - Added `getBundledModelPath()` - Platform-specific paths
   - Added `tryLoadBundledModel()` - Auto-load bundled model

2. **voiceService.ts**:
   - Added `autoInitializeOnDevice()` - Called on app start
   - Sets `onDeviceAvailable = true` if successful

3. **_layout.tsx**:
   - Added `useEffect` hook
   - Calls `autoInitializeOnDevice()` on mount

## Platform-Specific Details

### Android

**Asset Path**: `file:///android_asset/models/functiongemma-270m-it-Q4_K_M.gguf`

**How it works**:
- Model is copied to `android/app/src/main/assets/models/` during build
- Accessed via `file:///android_asset/` URI
- Bundled in APK (increases app size by ~150MB)

**Build Configuration**:
No extra config needed! Expo automatically includes `assets/` folder.

### iOS

**Asset Path**: `functiongemma-270m-it-Q4_K_M.gguf`

**How it works**:
- Model is added to iOS app bundle during build
- llama.rn automatically finds it in bundle
- Bundled in IPA (increases app size by ~150MB)

**Build Configuration**:
No extra config needed! Expo automatically includes `assets/` folder.

## App Size Impact

| Component | Size |
|-----------|------|
| Base app | ~20-30MB |
| llama.rn library | ~5MB |
| FunctionGemma model | ~150MB |
| **Total** | **~175-185MB** |

### Optimization Options

If app size is a concern:

1. **Use smaller quantization**:
   - Q4_K_M: ~150MB (recommended)
   - Q4_0: ~120MB (faster, lower quality)
   - Q3_K_M: ~100MB (much lower quality)

2. **Download on first launch**:
   - Don't bundle model
   - Download from CDN on first app open
   - Show progress indicator

3. **Hybrid approach**:
   - Bundle for premium users
   - Download for free users

## Fallback Strategy

The app is designed to work in multiple modes:

```typescript
// AUTO mode (default)
if (bundled_model_available) {
  use_on_device();
} else if (backend_available) {
  use_backend();
} else {
  show_error("No inference available");
}
```

Users can still:
- Use backend if model fails to load
- Manually load a different model via Settings
- Switch modes in Settings tab

## Troubleshooting

### "Model not found" on Android

**Solution**: Ensure model is in `ai-mobile/assets/models/` before running `npx expo prebuild`

### "Model not found" on iOS

**Solution**: 
1. Check model is in `ai-mobile/assets/models/`
2. Run `npx expo prebuild` again
3. Clean build: `cd ios && pod install && cd ..`

### App crashes on launch

**Causes**:
- Device has insufficient memory
- Model file is corrupted

**Solutions**:
1. Use Q4_0 quantization (smaller)
2. Test on device with more RAM
3. Re-download model file

### Build fails with "file too large"

**Solution**: This is normal for first build. Subsequent builds are faster.

## Distribution

### App Stores

**Google Play**:
- Max APK size: 100MB
- Use Android App Bundle (AAB) format
- Model will be in expansion file
- Command: `eas build --platform android --profile production`

**Apple App Store**:
- Max IPA size: 4GB (plenty of room)
- Model bundles normally
- Command: `eas build --platform ios --profile production`

### Over-the-Air (OTA) Updates

**Important**: Model changes require full app update, not OTA.

OTA updates work for:
- Code changes
- UI updates
- Bug fixes

Full rebuild needed for:
- Model changes
- Native module updates

## Best Practices

1. **Version the model**:
   ```typescript
   const MODEL_VERSION = "1.0.0";
   const MODEL_NAME = `functiongemma-270m-it-Q4_K_M-v${MODEL_VERSION}.gguf`;
   ```

2. **Add model metadata**:
   ```json
   // assets/models/model-info.json
   {
     "name": "FunctionGemma-270M-IT",
     "version": "1.0.0",
     "quantization": "Q4_K_M",
     "size_mb": 150,
     "sha256": "..."
   }
   ```

3. **Verify model integrity**:
   ```typescript
   const modelHash = await calculateSHA256(modelPath);
   if (modelHash !== EXPECTED_HASH) {
     console.error('Model corrupted!');
   }
   ```

## Next Steps

- [ ] Test on physical devices
- [ ] Measure actual app size
- [ ] Test cold start performance
- [ ] Add model update mechanism
- [ ] Implement download progress UI
- [ ] Add model verification

## References

- [Expo Asset Management](https://docs.expo.dev/guides/assets/)
- [llama.rn Documentation](https://github.com/mybigday/llama.rn)
- [FunctionGemma Models](https://huggingface.co/google/functiongemma-270m-it-GGUF)
