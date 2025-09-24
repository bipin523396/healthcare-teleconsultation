# -----------------------------------------------------------------------------
# Synergy AI (Jarvis + Sophia Lite) - Consolidated Core Script
# WARNING: API KEYS ARE HARDCODED HERE FOR CONVENIENCE/TESTING. THIS IS INSECURE.
# FOR A PRODUCTION/SECURE PROJECT, USE .ENV FILES OR ENVIRONMENT VARIABLES.
# -----------------------------------------------------------------------------
import os
import sys
import json
import inspect
import time
import requests
from datetime import datetime
import speech_recognition as sr
from gtts import gTTS
from playsound import playsound
import torch # For PyTorch and MPS device detection
from PIL import Image # For image processing in computer vision
import cv2 # OpenCV for camera access and image processing
from transformers import pipeline # For easy use of pre-trained vision models
import numpy as np # For array manipulation
import re # Import the regular expressions module for symbol filtering
import requests # This is already imported, but good practice to have it here for clarity.
import signal

# ----------------- 🔐 API KEYS & CONFIGURATION ------------------ #
OPENWEATHER_KEY = "9bbb3464a23fbfba4440a2f8a30ebacd"
POLYGON_KEY = "5BFxupg9bm1d3xHsklBgeTOf0yQfPVI"
WIKI_API = "https://en.wikipedia.org/w/api.php"
NEWS_API_KEY = "8bbf59992eec2d048797a5f9a0b93bd9c"
FINNHUB_KEY = "d1ti3mpr01qth6pldro0d1ti3mpr01qth6pldrog"
GOOGLE_API_KEYS = ["AIzaSyDTF68ltRc-3gZBh0qUX2AUNFtbFcm6u7o"]
GOOGLE_CX = "c150745450f7b4d8b"
SEARCHAPI_IO_KEY = "WX2Bu6XFAz3SoXeeuUxSVc4m"
PROXYCRAWL_KEYS = ["Nn15UeXUt8qC5HlaHqpUVA", "UxuA8ZKoxXoK_rqvcGj0Qw"]
SERPAPI_KEY = "09e538a7b57d3f0ad876a3e25dd5dd1ece56236a57dfadf95b86e5bbf3694b40"
ZENSERP_KEY = "456be090-5eb8-11f0-9fdf-59ce8e9d2c54"
SCRAPERAPI_KEYS = ["711e7b8eebd837c04d5f923c254fbebc", "86573e9606d5c94014560c65d25194fa"]
OLLAMA_API_URL = "http://localhost:11434"
OLLAMA_MODEL_NAME = "llama3"
VOICE_OUTPUT_ENABLED = True
MEMORY_FILE_PATH = "data/synergy_ai_memory.json"
FACE_RECOGNITION_ENABLED = False

# --- Device Setup ---
if torch.backends.mps.is_available():
    VISION_DEVICE = torch.device("mps")
    print("Using MPS (Apple Silicon GPU) for vision processing.")
elif torch.cuda.is_available():
    VISION_DEVICE = torch.device("cuda")
    print("Using CUDA (NVIDIA GPU) for vision processing.")
else:
    VISION_DEVICE = torch.device("cpu")
    print("Using CPU for vision processing.")
print(f"Current vision device: {VISION_DEVICE}")

# --- Voice Module ---
def clean_text_for_speech(text):
    cleaned_text = re.sub(r'[^a-zA-Z0-9.,?!\' ]', '', text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    return cleaned_text

def speak(text):
    if not VOICE_OUTPUT_ENABLED:
        print(f"Synergy AI (text): {text}")
        return
    cleaned_text = clean_text_for_speech(text)
    if not cleaned_text:
        print("DEBUG: Speech text was empty after cleaning.")
        return
    try:
        print(f"Synergy AI (speaking): {cleaned_text}")
        tts_audio = gTTS(text=cleaned_text, lang='en', slow=False)
        temp_audio_file = "temp_synergy_ai_speech.mp3"
        tts_audio.save(temp_audio_file)
        playsound(temp_audio_file)
        os.remove(temp_audio_file)
    except Exception as e:
        print(f"Error during TTS playback with gTTS: {e}")
        print("Please ensure you have an internet connection for gTTS and 'playsound' is working.")
        print(f"Synergy AI (text fallback): {cleaned_text}")

def listen_command():
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
            print("No speech detected within timeout.")
            return None
        except Exception as e:
            print(f"Error during listening: {e}. Please check your microphone.")
            speak("I couldn't hear you. Please check your microphone.")
            return None
    try:
        print("Recognizing...")
        command = r.recognize_google(audio)
        print(f"You said: {command}")
        return command.lower()
    except sr.UnknownValueError:
        print("Sorry, I could not understand the audio. Could you please repeat?")
        speak("Sorry, I could not understand the audio. Could you please repeat?")
        return None
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        speak("I'm having trouble with my speech recognition service. Please check your internet connection.")
        return None

# --- Memory Module ---
def load_memory():
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
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    with open(MEMORY_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump({'history': history}, f, indent=4, ensure_ascii=False)
    print(f"DEBUG: Memory saved to {MEMORY_FILE_PATH}")

def clear_memory():
    if os.path.exists(MEMORY_FILE_PATH):
        os.remove(MEMORY_FILE_PATH)
        print(f"DEBUG: Memory file {MEMORY_FILE_PATH} cleared.")
    else:
        print("DEBUG: No memory file to clear.")

# --- Search API Wrappers ---
def search_google(query):
    for key in GOOGLE_API_KEYS:
        try:
            res = requests.get("https://www.googleapis.com/customsearch/v1", params={
                "key": key,
                "cx": GOOGLE_CX,
                "q": query
            }).json()
            if "items" in res:
                return res["items"][0]["snippet"]
        except: continue
    return None

def search_searchapiio(query):
    try:
        res = requests.get("https://www.searchapi.io/api/v1/search", params={
            "q": query,
            "engine": "google",
            "api_key": SEARCHAPI_IO_KEY
        }).json()
        return res["organic_results"][0]["snippet"]
    except: return None

def search_serpapi(query):
    try:
        res = requests.get("https://serpapi.com/search", params={
            "q": query,
            "api_key": SERPAPI_KEY,
            "engine": "google"
        }).json()
        return res["organic_results"][0]["snippet"]
    except: return None

def search_zenserp(query):
    try:
        res = requests.get("https://app.zenserp.com/api/v2/search", params={
            "q": query,
            "apikey": ZENSERP_KEY
        }).json()
        return res["organic"][0]["description"]
    except: return None

def search_proxycrawl(query):
    for token in PROXYCRAWL_KEYS:
        try:
            res = requests.get("https://api.proxycrawl.com/", params={
                "token": token,
                "url": f"https://www.google.com/search?q={query}"
            }, verify=False)
            if res.status_code == 200:
                return f"ProxyCrawl search results available for '{query}'"
        except: continue
    return None

def search_scraperapi(query):
    for key in SCRAPERAPI_KEYS:
        try:
            res = requests.get("http://api.scraperapi.com", params={
                "api_key": key,
                "url": f"https://www.google.com/search?q={query}"
            })
            if res.status_code == 200:
                return f"ScraperAPI search results available for '{query}'"
        except: continue
    return None

# --- Live Data APIs ---
def get_weather(city):
    try:
        res = requests.get(f"http://api.openweathermap.org/data/2.5/weather", params={
            "q": city,
            "appid": OPENWEATHER_KEY,
            "units": "metric"
        }).json()
        return f"🌤️ {res['name']}: {res['main']['temp']}°C, {res['weather'][0]['description']}"
    except:
        return "❌ Weather data failed."

def get_polygon_stock(ticker):
    try:
        res = requests.get(f"https://api.polygon.io/v2/aggs/ticker/{ticker}/prev", params={
            "adjusted": "true",
            "apiKey": POLYGON_KEY
        }).json()
        return f"📈 {ticker}: Close = ${res['results'][0]['c']}"
    except:
        return "❌ Polygon stock data failed."

def get_finnhub_news():
    try:
        res = requests.get(f"https://finnhub.io/api/v1/news", params={
            "category": "general",
            "token": FINNHUB_KEY
        }).json()
        return f"🗞️ {res[0]['headline']} - {res[0]['summary']}"
    except:
        return "❌ Finnhub news failed."

def get_wiki_summary(topic):
    try:
        res = requests.get(WIKI_API, params={
            "action": "query",
            "prop": "extracts",
            "titles": topic,
            "exintro": True,
            "format": "json"
        }).json()
        page = next(iter(res['query']['pages'].values()))
        return page.get('extract', '❌ Wikipedia summary missing.')
    except:
        return "❌ Wikipedia fetch failed."

# --- Ollama Integration for Final Answer ---
def get_ollama_response(query: str, search_results: str) -> str:
    try:
        prompt_text = (
            f"Based on the following search results, provide a brief, concise, and direct answer to the user's query.\n\n"
            f"User Query: {query}\n\n"
            f"Search Results:\n{search_results}\n\n"
            f"Final Answer:"
        )
        url = f"{OLLAMA_API_URL}/api/generate"
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": OLLAMA_MODEL_NAME,
            "prompt": prompt_text,
            "stream": False
        }
        print("DEBUG: Sending search results to Ollama for final answer...")
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=60)
        response.raise_for_status()
        result_json = response.json()
        if 'response' in result_json:
            return result_json['response'].strip()
        else:
            print("ERROR: Ollama response did not contain a 'response' field.")
            return "❌ My AI brain failed to process the search results."
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not connect to Ollama. Is it running? Details: {e}")
        return "❌ I'm having trouble connecting to my local AI brain."
    except Exception as e:
        print(f"ERROR: An unexpected error occurred with Ollama: {e}")
        return "❌ An internal error occurred while processing the request."

# --- Rotated Search With Strict Sequential Fallback ---
API_USAGE_STATE_FILE = "data/api_usage_state.json"
SEARCH_PLATFORMS = [
    "serpapi",
    "zenserp",
    "google",
    "searchapiio",
    "proxycrawl",
    "scraperapi"
]

def load_api_usage_state():
    if os.path.exists(API_USAGE_STATE_FILE):
        try:
            with open(API_USAGE_STATE_FILE, "r") as f:
                state = json.load(f)
            if "next_index" in state and "unavailable" in state:
                return state
        except:
            pass
    return {
        "next_index": 0,
        "unavailable": []
    }

def save_api_usage_state(state):
    os.makedirs(os.path.dirname(API_USAGE_STATE_FILE), exist_ok=True)
    with open(API_USAGE_STATE_FILE, "w") as f:
        json.dump(state, f)

def is_quota_error(response_text):
    quota_keywords = ["quota", "limit", "exceeded", "daily limit", "rate limit", "403", "too many requests"]
    if response_text is None:
        return False
    response_text_lower = response_text.lower()
    return any(keyword in response_text_lower for keyword in quota_keywords)

def run_search_platform(platform, query):
    if platform == "serpapi":
        return search_serpapi(query)
    elif platform == "zenserp":
        return search_zenserp(query)
    elif platform == "google":
        return search_google(query)
    elif platform == "searchapiio":
        return search_searchapiio(query)
    elif platform == "proxycrawl":
        return search_proxycrawl(query)
    elif platform == "scraperapi":
        return search_scraperapi(query)
    else:
        return None

def rotated_search(query):
    state = load_api_usage_state()
    current_index = state.get("next_index", 0)
    unavailable = state.get("unavailable", [])
    platforms_len = len(SEARCH_PLATFORMS)
    attempts = 0

    while attempts < platforms_len:
        platform = SEARCH_PLATFORMS[current_index]
        if platform not in unavailable:
            print(f"🌐 Trying {platform} for query...")
            snippet = run_search_platform(platform, query)
            if snippet:
                if is_quota_error(snippet):
                    print(f"⚠️ Quota or limit hit on {platform}. Marking unavailable for today.")
                    unavailable.append(platform)
                    next_index = (current_index + 1) % platforms_len
                    state["unavailable"] = unavailable
                    state["next_index"] = next_index
                    save_api_usage_state(state)
                    current_index = next_index
                    attempts += 1
                    continue
                else:
                    state["next_index"] = current_index
                    state["unavailable"] = unavailable
                    save_api_usage_state(state)
                    final_answer = get_ollama_response(query, snippet)
                    return final_answer
            else:
                next_index = (current_index + 1) % platforms_len
                state["next_index"] = next_index
                state["unavailable"] = unavailable
                save_api_usage_state(state)
                current_index = next_index
                attempts += 1
                continue
        else:
            current_index = (current_index + 1) % platforms_len
            attempts += 1

    print("⚠️ All search platforms failed or unavailable. Falling back to Wikipedia...")
    wiki_result = get_wiki_summary(query)
    if wiki_result and "missing" not in wiki_result.lower():
        return f"Wikipedia: {wiki_result}"
    else:
        return "❌ All search platforms and Wikipedia lookup failed or no results."

# --- Main AI logic ---
def super_ai(query):
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["weather", "temperature", "climate", "forecast", "rain"]):
        print("🌦️ Fetching weather info...")
        weather_result = get_weather(query.split()[-1])
        if "❌" not in weather_result:
            return weather_result
    if any(word in query_lower for word in ["stock", "price", "share", "nifty", "market", "nasdaq", "bse", "sensex"]):
        print("📊 Fetching stock info...")
        for word in query.upper().split():
            if word.isalpha() and len(word) <= 5:
                result = get_polygon_stock(word)
                if "❌" not in result:
                    return result
    
    print("🌐 Initiating rotated search with Ollama final answer...")
    return rotated_search(query)

# --- Computer Vision Module --- (optional, as before)
try:
    face_detector = pipeline('object-detection', model='ultralytics/yolov8n-face', device=VISION_DEVICE)
    print("Face detection model loaded (YOLOv8n-face).")
except Exception as e:
    face_detector = None
    print(f"Warning: Could not load face detection model: {e}. Facial features will be limited.")

def analyze_facial_expression(frame_or_image_path):
    if not FACE_RECOGNITION_ENABLED:
        return "Facial recognition is disabled."
    if face_detector:
        if isinstance(frame_or_image_path, np.ndarray):
            image = Image.fromarray(cv2.cvtColor(frame_or_image_path, cv2.COLOR_BGR2RGB))
        elif isinstance(frame_or_image_path, str):
            image = Image.open(frame_or_image_path)
        else:
            return "Invalid input for facial analysis."
        try:
            faces = face_detector(image)
            if faces:
                return f"Detected {len(faces)} face(s). (Simulated Emotion: Neutral/Curious)"
            else:
                return "No faces detected."
        except Exception as e:
            return f"Error during face detection: {e}"
    return "Facial expression analysis not fully implemented/simulated."

# --- Signal handler ---
def handle_exit_signal(signum, frame):
    print("Shutting down Synergy AI...")
    speak("Shutting down")
    current_history = load_memory()
    save_memory(current_history)
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit_signal)
signal.signal(signal.SIGTERM, handle_exit_signal)

# --- Main loop ---
def run_synergy_ai():
    print("Initializing Synergy AI...")
    os.makedirs(os.path.dirname(MEMORY_FILE_PATH), exist_ok=True)
    
    speak("Initializing Synergy AI. How may I assist you?")
    
    conversation_history = load_memory()
    print(f"DEBUG: Loaded history with {len(conversation_history)} entries.")
    
    cap = None
    if FACE_RECOGNITION_ENABLED:
        try:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("Warning: Could not open webcam. Facial recognition will not work.")
                cap = None
            else:
                print("Webcam initialized for facial recognition.")
        except Exception as e:
            print(f"Error initializing webcam: {e}. Facial recognition will be disabled.")
            cap = None
    
    while True:
        vision_context = None
        if cap and FACE_RECOGNITION_ENABLED:
            ret, frame = cap.read()
            if ret:
                vision_context = analyze_facial_expression(frame)
            else:
                print("Warning: Could not read frame from webcam.")
        elif FACE_RECOGNITION_ENABLED and not cap:
            print("INFO: Facial recognition is enabled but webcam is not active. Please check settings.")
        
        command = listen_command()
        if command is None:
            continue
        
        if any(word in command for word in ["exit synergy", "goodbye synergy"]):
            speak("Goodbye! Have a great day.")
            save_memory(conversation_history)
            if cap:
                cap.release()
                cv2.destroyAllWindows()
            break

        if any(word in command for word in ["shutting down", "close", "stop"]):
            speak("Shutting down")
            save_memory(conversation_history)
            if cap:
                cap.release()
                cv2.destroyAllWindows()
            break
        
        response = super_ai(command)
        if response:
            speak(response)
            conversation_history.append({"role": "user", "content": command})
            conversation_history.append({"role": "model", "content": response})
            save_memory(conversation_history)
        else:
            speak("I'm sorry, I couldn't process that. Could you please rephrase?")

if __name__ == "__main__":
    os.makedirs('data', exist_ok=True)
    run_synergy_ai()