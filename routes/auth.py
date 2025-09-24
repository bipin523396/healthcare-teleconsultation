from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db, Patient

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Check if user already exists
    if Patient.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    # Create new patient
    new_patient = Patient(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        age=data.get('age'),
        gender=data.get('gender'),
        blood_type=data.get('blood_type'),
        contact_number=data.get('contact_number'),
        address=data.get('address'),
        emergency_contact=data.get('emergency_contact'),
        primary_doctor=data.get('primary_doctor')
    )

    try:
        db.session.add(new_patient)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=new_patient.id)
        
        return jsonify({
            'message': 'Registration successful',
            'access_token': access_token,
            'patient_id': new_patient.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    patient = Patient.query.filter_by(email=data['email']).first()

    if not patient or not check_password_hash(patient.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=patient.id)
    return jsonify({
        'access_token': access_token,
        'patient_id': patient.id
    }), 200

@auth.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    patient = Patient.query.get_or_404(current_user_id)

    return jsonify({
        'id': patient.id,
        'name': patient.name,
        'email': patient.email,
        'age': patient.age,
        'gender': patient.gender,
        'blood_type': patient.blood_type,
        'contact_number': patient.contact_number,
        'address': patient.address,
        'emergency_contact': patient.emergency_contact,
        'primary_doctor': patient.primary_doctor,
        'registration_date': patient.registration_date.isoformat()
    }), 200

@auth.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    patient = Patient.query.get_or_404(current_user_id)
    data = request.get_json()

    # Update fields
    for field in ['name', 'age', 'gender', 'blood_type', 'contact_number', 
                 'address', 'emergency_contact', 'primary_doctor']:
        if field in data:
            setattr(patient, field, data[field])

    try:
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500