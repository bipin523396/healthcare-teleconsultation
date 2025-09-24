from flask import Flask
from flask_cors import CORS
from app import app, db
from routes.auth import auth
from routes.medical import medical
from routes.emergency import emergency

# Register blueprints
app.register_blueprint(auth, url_prefix='/api/auth')
app.register_blueprint(medical, url_prefix='/api/medical')
app.register_blueprint(emergency, url_prefix='/api/emergency')

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Resource not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return {'error': 'Internal server error'}, 500

# Health check endpoint
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}

if __name__ == '__main__':
    # Create all database tables
    with app.app_context():
        db.create_all()
    
    # Start the server
    app.run(host='0.0.0.0', port=5001, debug=True)