# Voice Browser Quick Start Guide

## Testing Voice Commands

### On Web (Easiest)

1. **Start the app**:
   ```bash
   cd ai-mobile
   npx expo start --web
   ```

2. **Navigate to Browser tab**

3. **Click the microphone icon**

4. **Speak a command**:
   - "Open Google"
   - "Search for artificial intelligence"
   - "Go back"
   - "Refresh page"

5. **Watch the magic happen!**

### On Physical Device (iOS/Android)

#### Prerequisites
- Physical device on same WiFi as your computer
- Backend server running

#### Steps

1. **Create development build** (one-time setup):
   ```bash
   # For Android
   npx expo run:android
   
   # For iOS (requires Mac)
   npx expo run:ios
   ```

2. **Start Metro bundler**:
   ```bash
   npx expo start --dev-client
   ```

3. **Open app on device**

4. **Grant permissions**:
   - Microphone access
   - Speech recognition (iOS only)

5. **Test voice commands** in Browser tab

## Supported Voice Commands

| Command Pattern | Example | Function |
|----------------|---------|----------|
| `open [website]` | "open youtube" | Navigate to website |
| `search for [query]` | "search for cats" | Google search |
| `go back` | "go back" | Browser back |
| `go forward` | "go forward" | Browser forward |
| `refresh page` | "refresh page" | Reload current page |

## Troubleshooting

### Voice not recognized

**Web**:
- Ensure you're using Chrome or Edge
- Check browser microphone permissions
- Speak clearly and wait for "Listening..." status

**Mobile**:
- Check app has microphone permission in Settings
- Ensure you're using a development build (not Expo Go)
- Try restarting the app

### Backend connection errors

1. **Check backend is running**:
   ```bash
   # Should see "Uvicorn running on http://0.0.0.0:8000"
   ```

2. **Verify network**:
   - Device and computer on same WiFi
   - Check IP address in `services/voiceService.ts`

3. **Test backend directly**:
   ```bash
   curl http://localhost:8000/
   # Should return: {"status":"online","model":"functiongemma:latest"}
   ```

### Permission denied errors

**iOS**:
- Go to Settings → Privacy → Microphone → Enable for your app
- Go to Settings → Privacy → Speech Recognition → Enable for your app

**Android**:
- Go to Settings → Apps → Your App → Permissions → Enable Microphone

## Advanced Usage

### Custom Commands

To add new browser commands, edit:

1. **Backend** (`backend/main.py`):
   ```python
   # Add to system_prompt in parse_command()
   - scroll_down() - Scroll page down
   ```

2. **Frontend** (`app/(tabs)/browser.tsx`):
   ```typescript
   case 'scroll_down':
       webViewRef.current?.injectJavaScript('window.scrollBy(0, 500);');
       break;
   ```

### Contextual Strings

Improve recognition accuracy by adding domain-specific words in `hooks/useVoiceRecognition.ts`:

```typescript
contextualStrings: [
  'open',
  'search',
  'youtube',    // Add your frequently used sites
  'wikipedia',
  'github',
]
```

## Performance Tips

1. **Speak clearly** with minimal background noise
2. **Wait for "Listening..."** before speaking
3. **Use short commands** (3-5 words optimal)
4. **Pause after command** to let it process

## Next Steps

- Try combining commands: "search for weather in Tokyo"
- Test on different websites
- Experiment with URL shortcuts: "open github" → github.com
- Check backend logs to see how commands are parsed
