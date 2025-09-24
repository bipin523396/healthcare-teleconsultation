from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import cv2
import numpy as np
from datetime import datetime
from synergy_ai_service import ai_service

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load environment variables
load_dotenv()

# Create necessary directories
os.makedirs('uploads', exist_ok=True)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({
                'status': 'error',
                'message': 'Message is required'
            }), 400
            
        # Process the message using our AI service
        result = ai_service.process_message(message)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/voice/recognize', methods=['POST'])
def recognize_speech():
    try:
        if 'audio' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No audio file provided'
            }), 400
            
        audio_file = request.files['audio']
        if not audio_file.filename:
            return jsonify({
                'status': 'error',
                'message': 'No selected file'
            }), 400
            
        # Save the audio file temporarily
        os.makedirs('uploads', exist_ok=True)
        temp_audio_path = os.path.join('uploads', f'audio_{int(datetime.now().timestamp())}.wav')
        audio_file.save(temp_audio_path)
        
        # For now, return a success response with a test message
        # In a real implementation, you would process the audio file here
        response = {
            'status': 'success',
            'text': 'This is a test response from voice recognition. In a real implementation, this would be the transcribed text from the audio.',
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error processing audio: {str(e)}'
        }), 500

@app.route('/api/vision/analyze', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No image file provided'
            }), 400
            
        image_file = request.files['image']
        if not image_file.filename:
            return jsonify({
                'status': 'error',
                'message': 'No selected file'
            }), 400
            
        # Save the image file temporarily
        os.makedirs('uploads', exist_ok=True)
        temp_image_path = os.path.join('uploads', f'image_{int(datetime.now().timestamp())}.jpg')
        image_file.save(temp_image_path)
        
        # For now, return a success response with a test message
        # In a real implementation, you would process the image here
        response = {
            'status': 'success',
            'analysis': 'This is a test response from image analysis. In a real implementation, this would contain the analysis results.',
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error processing image: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'Synergy AI',
        'version': '1.0.0',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('uploads', exist_ok=True)
    
    # Start the server
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
