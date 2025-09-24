#!/usr/bin/env python

"""
Run Synergy AI Backend Server
-----------------------------
This script starts the Flask server for the Synergy AI API.
"""

from synergy_api import app

if __name__ == '__main__':
    print("Starting Synergy AI Backend Server...")
    print("API will be available at http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)