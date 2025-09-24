from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, Patient
from datetime import datetime
import requests

emergency = Blueprint('emergency', __name__)

# Emergency contact information
EMERGENCY_SERVICES = {
    'ambulance': '911',
    'poison_control': '1-800-222-1222',
    'crisis_hotline': '988'
}

# Mock emergency detection status
emergency_detection_status = {}

@emergency.route('/activate', methods=['POST'])
@jwt_required()
def activate_emergency_detection():
    current_user_id = get_jwt_identity()
    patient = Patient.query.get_or_404(current_user_id)

    # Activate emergency detection for the patient
    emergency_detection_status[current_user_id] = {
        'active': True,
        'activated_at': datetime.utcnow(),
        'location_tracking': True
    }

    return jsonify({
        'message': 'Emergency detection activated',
        'status': emergency_detection_status[current_user_id]
    }), 200

@emergency.route('/deactivate', methods=['POST'])
@jwt_required()
def deactivate_emergency_detection():
    current_user_id = get_jwt_identity()
    
    if current_user_id in emergency_detection_status:
        emergency_detection_status[current_user_id]['active'] = False
        emergency_detection_status[current_user_id]['deactivated_at'] = datetime.utcnow()
        return jsonify({'message': 'Emergency detection deactivated'}), 200
    
    return jsonify({'message': 'Emergency detection was not active'}), 400

@emergency.route('/status', methods=['GET'])
@jwt_required()
def get_emergency_detection_status():
    current_user_id = get_jwt_identity()
    status = emergency_detection_status.get(current_user_id, {'active': False})
    return jsonify(status), 200

@emergency.route('/alert', methods=['POST'])
@jwt_required()
def trigger_emergency_alert():
    current_user_id = get_jwt_identity()
    patient = Patient.query.get_or_404(current_user_id)
    data = request.get_json()

    # Emergency alert details
    alert = {
        'patient_id': current_user_id,
        'patient_name': patient.name,
        'contact_number': patient.contact_number,
        'emergency_contact': patient.emergency_contact,
        'location': data.get('location', 'Unknown'),
        'alert_type': data.get('alert_type', 'general'),
        'timestamp': datetime.utcnow().isoformat(),
        'vital_signs': data.get('vital_signs', {}),
        'description': data.get('description', 'Emergency alert triggered')
    }

    # In a real implementation, this would:
    # 1. Contact emergency services
    # 2. Notify emergency contacts
    # 3. Alert nearby healthcare providers
    # 4. Log the emergency event

    return jsonify({
        'message': 'Emergency alert triggered',
        'alert': alert,
        'emergency_numbers': EMERGENCY_SERVICES
    }), 200

@emergency.route('/contacts', methods=['GET'])
@jwt_required()
def get_emergency_contacts():
    return jsonify({
        'emergency_services': EMERGENCY_SERVICES,
        'message': 'For immediate emergency assistance, please dial 911'
    }), 200

# Monitoring thresholds for vital signs
VITAL_THRESHOLDS = {
    'heart_rate': {'min': 60, 'max': 100},
    'blood_pressure_systolic': {'min': 90, 'max': 140},
    'blood_pressure_diastolic': {'min': 60, 'max': 90},
    'temperature': {'min': 97.8, 'max': 99.1},
    'oxygen_saturation': {'min': 95, 'max': 100},
    'respiratory_rate': {'min': 12, 'max': 20}
}

@emergency.route('/monitor/vitals', methods=['POST'])
@jwt_required()
def monitor_vital_signs():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    vitals = data.get('vital_signs', {})
    alerts = []

    for vital, value in vitals.items():
        if vital in VITAL_THRESHOLDS:
            thresholds = VITAL_THRESHOLDS[vital]
            if value < thresholds['min'] or value > thresholds['max']:
                alerts.append({
                    'vital': vital,
                    'value': value,
                    'threshold': thresholds,
                    'status': 'abnormal'
                })

    response = {
        'timestamp': datetime.utcnow().isoformat(),
        'patient_id': current_user_id,
        'vitals': vitals,
        'alerts': alerts,
        'status': 'critical' if alerts else 'normal'
    }

    # If there are alerts, this could trigger emergency procedures
    if alerts and current_user_id in emergency_detection_status and \
       emergency_detection_status[current_user_id]['active']:
        response['emergency_triggered'] = True
        # This would trigger emergency procedures in a real implementation

    return jsonify(response), 200