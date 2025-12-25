# Download FunctionGemma GGUF Model for Windows
# This script downloads the quantized model for bundling with the app

Write-Host "📦 Downloading FunctionGemma-270M-IT GGUF model..." -ForegroundColor Cyan

# Create assets directory if it doesn't exist
$modelsDir = "ai-mobile\assets\models"
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
}

# Install huggingface_hub if not already installed
Write-Host "Installing huggingface_hub..." -ForegroundColor Yellow
pip install -q huggingface_hub

# Download the model
Write-Host "Downloading model (this may take a few minutes)..." -ForegroundColor Yellow
huggingface-cli download ggml-org/functiongemma-270m-it-GGUF `
    functiongemma-270m-it-Q4_K_M.gguf `
    --local-dir $modelsDir

Write-Host ""
Write-Host "✅ Model downloaded successfully!" -ForegroundColor Green
Write-Host "📍 Location: $modelsDir\functiongemma-270m-it-Q4_K_M.gguf" -ForegroundColor Green
Write-Host "📊 Model size: ~150MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx expo prebuild" -ForegroundColor White
Write-Host "2. Build app: npx expo run:android (or run:ios)" -ForegroundColor White
Write-Host "3. Model will be bundled automatically!" -ForegroundColor White
