#!/usr/bin/env python

# -----------------------------------------------------------------------------
# Synergy AI API - Flask wrapper for Synergy AI
# -----------------------------------------------------------------------------
# This script provides API endpoints for the Synergy AI agent to be used by the frontend
# -----------------------------------------------------------------------------

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
import time
from datetime import datetime
import threading

# Import necessary modules for voice processing
try:
    import speech_recognition as sr
    from gtts import gTTS
    VOICE_MODULES_AVAILABLE = True
except ImportError:
    VOICE_MODULES_AVAILABLE = False
    print("Warning: Voice modules not available. Voice features will be disabled.")

# Configuration
MEMORY_FILE_PATH = "data/synergy_ai_memory.json"
VOICE_OUTPUT_ENABLED = True

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Memory Module ---
def load_memory():
    """Loads conversation history from a JSON file."""
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    if os.path.exists(MEMORY_FILE_PATH):
        with open(MEMORY_FILE_PATH, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                return data.get('history', [])
            except json.JSONDecodeError:
                print(f"Warning: {MEMORY_FILE_PATH} is corrupted or empty. Starting with empty memory.")
                return []
    return []

def save_memory(history: list):
    """Saves conversation history to a JSON file."""
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    with open(MEMORY_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump({'history': history}, f, ensure_ascii=False, indent=2)

def clean_text_for_speech(text):
    """
    Removes unwanted symbols, URLs, and excessive whitespace from text for clearer speech output.
    """
    # Remove URLs
    cleaned_text = re.sub(r'http\S+|www\S+', '', text)
    # Remove special characters like @, #, *, emojis, etc., while preserving standard punctuation
    cleaned_text = re.sub(r'[\*@#&]', '', cleaned_text)
    # Remove any stray spaces and replace multiple spaces with one
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    return cleaned_text

def generate_ai_response(user_message):
    """
    Generate a response from the AI based on the user's message.
    This is a simplified version of the AI logic for demonstration.
    In a real implementation, this would use the full Synergy AI capabilities.
    """
    # Load conversation history
    history = load_memory()
    
    # Add user message to history
    history.append({
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now().isoformat()
    })
    
    # Simple response logic (to be replaced with actual AI processing)
    if "appointment" in user_message.lower():
        response = "I can help you schedule an appointment. What day works best for you?"
    elif "medication" in user_message.lower():
        response = "Your medication schedule shows you should take your next dose at 8:00 PM."
    elif "pain" in user_message.lower() or "hurt" in user_message.lower():
        response = "I'm sorry to hear you're in pain. Have you taken any medication for it? If it persists, you should contact your doctor."
    elif "doctor" in user_message.lower():
        response = "Dr. Smith is available next Tuesday. Would you like me to book an appointment?"
    elif "hello" in user_message.lower() or "hi" in user_message.lower():
        response = "Hello! I'm your healthcare AI assistant. How can I help you today?"
    else:
        response = "I'm here to help with your healthcare needs. Can you tell me more about what you're looking for?"
    
    # Add AI response to history
    history.append({
        "role": "assistant",
        "content": response,
        "timestamp": datetime.now().isoformat()
    })
    
    # Save updated history
    save_memory(history)
    
    return response

# --- API Routes ---

@app.route('/api/health-check', methods=['GET'])
def health_check():
    """Health check endpoint to verify the API is running."""
    return jsonify({"status": "ok", "message": "Synergy AI API is running"})

@app.route('/api/ai-agent', methods=['POST'])
def ai_agent():
    """Process a text message and return an AI response."""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    user_message = data['message']
    
    # Generate AI response
    response = generate_ai_response(user_message)
    
    return jsonify({"response": response})

@app.route('/api/voice-input', methods=['POST'])
def voice_input():
    """Process voice input and return the transcribed text."""
    if not VOICE_MODULES_AVAILABLE:
        return jsonify({"error": "Voice modules not available"}), 503
    
    try:
        r = sr.Recognizer()
        with sr.Microphone() as source:
            print("Calibrating for ambient noise...")
            r.adjust_for_ambient_noise(source, duration=1)
            print("Listening...")
            audio = r.listen(source, timeout=5)
        
        text = r.recognize_google(audio)
        return jsonify({"success": True, "text": text})
    except sr.UnknownValueError:
        return jsonify({"success": False, "error": "Could not understand audio"})
    except sr.RequestError:
        return jsonify({"success": False, "error": "Could not request results from speech recognition service"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/voice-output', methods=['POST'])
def voice_output():
    """Convert text to speech and play it."""
    if not VOICE_MODULES_AVAILABLE:
        return jsonify({"error": "Voice modules not available"}), 503
    
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    cleaned_text = clean_text_for_speech(text)
    
    try:
        # This would normally play audio, but for API purposes we'll just return success
        # In a real implementation, you might want to stream the audio or handle it differently
        tts_audio = gTTS(text=cleaned_text, lang='en', slow=False)
        temp_audio_file = "temp_synergy_ai_speech.mp3"
        tts_audio.save(temp_audio_file)
        
        # In a real implementation, you would play the audio here
        # For now, we'll just simulate it
        time.sleep(1)
        
        # Clean up
        if os.path.exists(temp_audio_file):
            os.remove(temp_audio_file)
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)