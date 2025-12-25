#!/bin/bash

# Download FunctionGemma GGUF Model
# This script downloads the quantized model for bundling with the app

echo "📦 Downloading FunctionGemma-270M-IT GGUF model..."

# Create assets directory if it doesn't exist
mkdir -p ai-mobile/assets/models

# Download using huggingface-cli
pip install -q huggingface_hub

huggingface-cli download ggml-org/functiongemma-270m-it-GGUF \
    functiongemma-270m-it-Q4_K_M.gguf \
    --local-dir ./ai-mobile/assets/models

echo "✅ Model downloaded to: ai-mobile/assets/models/functiongemma-270m-it-Q4_K_M.gguf"
echo "📊 Model size: ~150MB"
echo ""
echo "Next steps:"
echo "1. Run: npx expo prebuild"
echo "2. Build app: npx expo run:android (or run:ios)"
echo "3. Model will be bundled automatically!"
