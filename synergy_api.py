#!/usr/bin/env python

# -----------------------------------------------------------------------------
# Synergy AI API - Flask wrapper for Synergy AI
# -----------------------------------------------------------------------------
# This script creates a Flask API to interface with the Synergy AI core
# functionality, making it accessible to the frontend application.
# -----------------------------------------------------------------------------

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
import threading
import re
from gtts import gTTS
import speech_recognition as sr

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
MEMORY_FILE_PATH = "data/synergy_ai_memory.json"
VOICE_OUTPUT_ENABLED = True
TEMP_AUDIO_PATH = "temp_synergy_ai_speech.mp3"

# Ensure data directory exists
os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)

# --- Memory Module ---
def load_memory():
    """Loads conversation history from a JSON file."""
    if os.path.exists(MEMORY_FILE_PATH):
        with open(MEMORY_FILE_PATH, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                return data.get('history', [])
            except json.JSONDecodeError:
                print(f"Warning: {MEMORY_FILE_PATH} is corrupted or empty. Starting with empty memory.")
                return []
    return []

def save_memory(history):
    """Saves conversation history to a JSON file."""
    with open(MEMORY_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump({'history': history}, f, ensure_ascii=False, indent=2)

# --- Voice Module ---
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

def generate_speech(text):
    """Converts text to speech using gTTS and returns the path to the audio file."""
    cleaned_text = clean_text_for_speech(text)
    if not cleaned_text:
        return None

    try:
        tts_audio = gTTS(text=cleaned_text, lang='en', slow=False)
        tts_audio.save(TEMP_AUDIO_PATH)
        return TEMP_AUDIO_PATH
    except Exception as e:
        print(f"Error during TTS generation: {e}")
        return None

def listen_for_voice():
    """Listens for voice input and returns the recognized text."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("Calibrating for ambient noise, please wait...")
        r.adjust_for_ambient_noise(source, duration=1)
        print("Listening for command...")
        r.pause_threshold = 0.8
        r.energy_threshold = 4000
        r.phrase_time_limit = 10

        try:
            audio = r.listen(source, timeout=6)
        except sr.WaitTimeoutError:
            return {"success": False, "error": "No speech detected within timeout."}
        except Exception as e:
            return {"success": False, "error": f"Error during listening: {e}. Please check your microphone."}

    try:
        print("Recognizing...")
        command = r.recognize_google(audio)
        print(f"Recognized: {command}")
        return {"success": True, "text": command}
    except sr.UnknownValueError:
        return {"success": False, "error": "Could not understand audio"}
    except sr.RequestError as e:
        return {"success": False, "error": f"Could not request results from Google Speech Recognition service; {e}"}

# --- AI Response Generation ---
def generate_ai_response(user_message):
    """
    Generate a response from the AI based on the user's message.
    This is a simplified version - in a real implementation, this would call
    the full Synergy AI processing pipeline.
    """
    # Load conversation history
    history = load_memory()
    
    # Add user message to history
    history.append({"role": "user", "content": user_message, "timestamp": time.time()})
    
    # For now, generate a simple response based on keywords
    response = "I'm sorry, I don't understand that yet."
    
    if "hello" in user_message.lower() or "hi" in user_message.lower():
        response = "Hello! I'm Synergy AI, your healthcare assistant. How can I help you today?"
    elif "appointment" in user_message.lower() or "schedule" in user_message.lower():
        response = "I can help you schedule an appointment. What day and time works best for you?"
    elif "doctor" in user_message.lower() or "physician" in user_message.lower():
        response = "We have several doctors available. Would you like me to list them for you?"
    elif "symptom" in user_message.lower() or "pain" in user_message.lower() or "feel" in user_message.lower():
        response = "I'm sorry to hear you're not feeling well. Can you describe your symptoms in more detail so I can provide better assistance?"
    elif "medication" in user_message.lower() or "prescription" in user_message.lower():
        response = "I can provide information about your medications. Which one would you like to know about?"
    elif "thank" in user_message.lower():
        response = "You're welcome! Is there anything else I can help you with?"
    elif "bye" in user_message.lower() or "goodbye" in user_message.lower():
        response = "Goodbye! Take care and stay healthy."
    
    # Add AI response to history
    history.append({"role": "assistant", "content": response, "timestamp": time.time()})
    
    # Save updated history
    save_memory(history)
    
    return response

# --- API Routes ---
@app.route('/api/health-check', methods=['GET'])
def health_check():
    """API health check endpoint."""
    return jsonify({"status": "ok"})

@app.route('/api/ai-agent', methods=['POST'])
def ai_agent():
    """Process a text message and return an AI response."""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    user_message = data['message']
    response = generate_ai_response(user_message)
    
    return jsonify({"response": response})

@app.route('/api/voice-input', methods=['POST'])
def voice_input():
    """Listen for voice input and return the recognized text."""
    result = listen_for_voice()
    return jsonify(result)

@app.route('/api/voice-output', methods=['POST'])
def voice_output():
    """Convert text to speech."""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    text = data['text']
    audio_path = generate_speech(text)
    
    if audio_path:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": "Failed to generate speech"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)