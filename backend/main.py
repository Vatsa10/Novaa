from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import requests
import uvicorn
import json

app = FastAPI()

# Enable CORS for mobile development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "functiongemma:latest"

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    messages: list

class FunctionCallRequest(BaseModel):
    command: str

class FunctionCall(BaseModel):
    name: str
    parameters: Dict[str, str]

@app.get("/")
def health_check():
    return {"status": "online", "model": MODEL_NAME}

@app.post("/chat")
async def chat(payload: ChatRequest):
    # We pass messages directly to Ollama without forcing JSON structure
    messages = payload.messages

    try:
        print(f"Sending request to Ollama ({MODEL_NAME})...")
        res = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False,
        })
        res.raise_for_status()
        
        ollama_res = res.json()
        content = ollama_res.get("message", {}).get("content", "")
        
        return {
            "intent": "chat",
            "message": content,
            "data": {}
        }

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama is not running on port 11434.")
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-command", response_model=FunctionCall)
async def parse_command(payload: FunctionCallRequest):
    """Parse natural language command into structured function call using FunctionGemma"""
    
    system_prompt = """You are a function calling assistant for a voice-controlled browser. 
Parse user commands into JSON function calls with this exact structure:
{
  "name": "function_name",
  "parameters": {"key": "value"}
}

Available functions:
- open_browser(url: string) - Navigate to a URL
- search_web(query: string) - Search Google
- go_back() - Navigate back
- go_forward() - Navigate forward  
- refresh_page() - Reload page

Examples:
"open google" -> {"name": "open_browser", "parameters": {"url": "google.com"}}
"search for cats" -> {"name": "search_web", "parameters": {"query": "cats"}}
"go back" -> {"name": "go_back", "parameters": {}}

Return ONLY the JSON, no explanation."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": payload.command}
    ]

    try:
        print(f"Parsing command: {payload.command}")
        res = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False,
            "format": "json"
        })
        res.raise_for_status()
        
        content = res.json().get("message", {}).get("content", "{}")
        
        # Clean markdown if present
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "").strip()
        
        parsed = json.loads(content)
        
        # Validate and return
        function_call = FunctionCall(**parsed)
        print(f"Parsed function: {function_call.name} with params: {function_call.parameters}")
        return function_call
        
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Parse error: {e}, raw: {content}")
        # Fallback: treat as search query
        return FunctionCall(name="search_web", parameters={"query": payload.command})
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Ollama is not running")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Host 0.0.0.0 allows access from other devices on the network (e.g. mobile phone/emulator)
    uvicorn.run(app, host="0.0.0.0", port=8000)
