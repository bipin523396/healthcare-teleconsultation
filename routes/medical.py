from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, MedicalRecord, Appointment, Prescription, HealthMetric, Doctor
from datetime import datetime

medical = Blueprint('medical', __name__)

# Medical Records Routes
@medical.route('/records', methods=['GET'])
@jwt_required()
def get_medical_records():
    current_user_id = get_jwt_identity()
    records = MedicalRecord.query.filter_by(patient_id=current_user_id).all()
    
    return jsonify([{
        'id': record.id,
        'date': record.date.isoformat(),
        'doctor': record.doctor,
        'diagnosis': record.diagnosis,
        'notes': record.notes
    } for record in records]), 200

@medical.route('/records', methods=['POST'])
@jwt_required()
def add_medical_record():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    new_record = MedicalRecord(
        patient_id=current_user_id,
        date=datetime.fromisoformat(data['date']),
        doctor=data['doctor'],
        diagnosis=data['diagnosis'],
        notes=data.get('notes')
    )

    try:
        db.session.add(new_record)
        db.session.commit()
        return jsonify({'message': 'Medical record added successfully', 'id': new_record.id}), 201
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

# Appointments Routes
@medical.route('/appointments', methods=['GET'])
@jwt_required()
def get_appointments():
    current_user_id = get_jwt_identity()
    appointments = Appointment.query.filter_by(patient_id=current_user_id).join(Doctor).all()
    
    return jsonify([{
        'id': appt.id,
        'doctor': {
            'id': appt.assigned_doctor.id,
            'name': appt.assigned_doctor.name,
            'specialty': appt.assigned_doctor.specialty,
            'imageUrl': appt.assigned_doctor.imageUrl
        },
        'date': appt.date.isoformat(),
        'time': appt.time,
        'status': appt.status,
        'type': appt.type,
        'notes': appt.notes,
        'created_at': appt.created_at.isoformat(),
        'updated_at': appt.updated_at.isoformat()
    } for appt in appointments]), 200

@medical.route('/appointments', methods=['POST'])
@jwt_required()
def schedule_appointment():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # Verify doctor exists and is active
    doctor = Doctor.query.filter_by(id=data['doctor_id'], isActive=True).first()
    if not doctor:
        return jsonify({'error': 'Doctor not found or inactive'}), 404

    new_appointment = Appointment(
        patient_id=current_user_id,
        doctor_id=doctor.id,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        time=data['time'],
        type=data['type'],
        notes=data.get('notes', '')
    )

    try:
        db.session.add(new_appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment scheduled successfully',
            'appointment': {
                'id': new_appointment.id,
                'doctor': {
                    'id': doctor.id,
                    'name': doctor.name,
                    'specialty': doctor.specialty
                },
                'date': new_appointment.date.isoformat(),
                'time': new_appointment.time,
                'type': new_appointment.type,
                'status': new_appointment.status,
                'notes': new_appointment.notes,
                'created_at': new_appointment.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

@medical.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    current_user_id = get_jwt_identity()
    appointment = Appointment.query.filter_by(id=appointment_id, patient_id=current_user_id).first_or_404()
    data = request.get_json()

    if 'status' in data:
        appointment.status = data['status']
    if 'date' in data:
        appointment.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'time' in data:
        appointment.time = data['time']

    try:
        db.session.commit()
        return jsonify({'message': 'Appointment updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

# Prescriptions Routes
@medical.route('/prescriptions', methods=['GET'])
@jwt_required()
def get_prescriptions():
    current_user_id = get_jwt_identity()
    prescriptions = Prescription.query.filter_by(patient_id=current_user_id).all()
    
    return jsonify([{
        'id': rx.id,
        'name': rx.name,
        'dosage': rx.dosage,
        'frequency': rx.frequency,
        'start_date': rx.start_date.isoformat(),
        'end_date': rx.end_date.isoformat() if rx.end_date else None,
        'doctor': rx.doctor,
        'refills_left': rx.refills_left
    } for rx in prescriptions]), 200

@medical.route('/prescriptions', methods=['POST'])
@jwt_required()
def add_prescription():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    new_prescription = Prescription(
        patient_id=current_user_id,
        name=data['name'],
        dosage=data['dosage'],
        frequency=data['frequency'],
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
        doctor=data['doctor'],
        refills_left=data.get('refills_left', 0)
    )

    try:
        db.session.add(new_prescription)
        db.session.commit()
        return jsonify({'message': 'Prescription added successfully', 'id': new_prescription.id}), 201
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

# Doctor Management Routes
@medical.route('/doctors', methods=['GET', 'OPTIONS'])
def get_doctors():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        doctors = Doctor.query.filter_by(isActive=True).all()
        return jsonify([{
            'id': doc.id,
            'name': doc.name,
            'specialty': doc.specialty,
            'imageUrl': doc.imageUrl,
            'availableDates': doc.availableDates,
            'qualifications': doc.qualifications,
            'experience': doc.experience,
            'languages': doc.languages,
            'bio': doc.bio,
            'rating': doc.rating,
            'email': doc.email,
            'phone': doc.phone,
            'consultationTypes': doc.consultationTypes,
            'fees': doc.fees,
            'isActive': doc.isActive
        } for doc in doctors]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@medical.route('/doctors', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def add_doctor():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['name', 'specialty', 'email', 'phone', 'bio', 'qualifications', 'languages']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing or empty required fields: {", ".join(missing_fields)}'}), 400
        
        # Validate email format
        if '@' not in data['email']:
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Check if email already exists
        existing_doctor = Doctor.query.filter_by(email=data['email']).first()
        if existing_doctor:
            return jsonify({'error': 'A doctor with this email already exists'}), 409
        
        # Validate qualifications and languages are lists
        if not isinstance(data.get('qualifications', []), list):
            return jsonify({'error': 'Qualifications must be a list'}), 400
        if not isinstance(data.get('languages', []), list):
            return jsonify({'error': 'Languages must be a list'}), 400
            
        # Validate consultation types
        valid_consultation_types = ['in-person', 'teleconsultation', 'video', 'audio']
        consultation_types = data.get('consultationTypes', [])
        if not isinstance(consultation_types, list):
            return jsonify({'error': 'Consultation types must be a list'}), 400
        invalid_types = [t for t in consultation_types if t not in valid_consultation_types]
        if invalid_types:
            return jsonify({'error': f'Invalid consultation types: {", ".join(invalid_types)}'}), 400
        
        new_doctor = Doctor(
            name=data['name'].strip(),
            specialty=data['specialty'].strip(),
            imageUrl=data.get('imageUrl'),
            availableDates=data.get('availableDates', []),
            qualifications=data.get('qualifications', []),
            experience=data.get('experience', 0),
            languages=data.get('languages', []),
            bio=data.get('bio', '').strip(),
            rating=data.get('rating', 5.0),
            email=data['email'].strip().lower(),
            phone=data['phone'].strip(),
            consultationTypes=consultation_types,
            fees=data.get('fees', 0),
            isActive=True
        )
        
        db.session.add(new_doctor)
        db.session.commit()
        
        return jsonify({
            'message': 'Doctor added successfully',
            'doctor': {
                'id': new_doctor.id,
                'name': new_doctor.name,
                'specialty': new_doctor.specialty,
                'imageUrl': new_doctor.imageUrl,
                'availableDates': new_doctor.availableDates,
                'qualifications': new_doctor.qualifications,
                'experience': new_doctor.experience,
                'languages': new_doctor.languages,
                'bio': new_doctor.bio,
                'rating': new_doctor.rating,
                'email': new_doctor.email,
                'phone': new_doctor.phone,
                'consultationTypes': new_doctor.consultationTypes,
                'fees': new_doctor.fees,
                'isActive': new_doctor.isActive
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

@medical.route('/doctors/<int:doctor_id>', methods=['PUT', 'OPTIONS'])
@jwt_required(optional=True)
def update_doctor(doctor_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        doctor = Doctor.query.get_or_404(doctor_id)
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        for key, value in data.items():
            if hasattr(doctor, key):
                setattr(doctor, key, value)
        
        db.session.commit()
        return jsonify({
            'message': 'Doctor updated successfully',
            'doctor': {
                'id': doctor.id,
                'name': doctor.name,
                'specialty': doctor.specialty,
                'imageUrl': doctor.imageUrl,
                'availableDates': doctor.availableDates,
                'qualifications': doctor.qualifications,
                'experience': doctor.experience,
                'languages': doctor.languages,
                'bio': doctor.bio,
                'rating': doctor.rating,
                'email': doctor.email,
                'phone': doctor.phone,
                'consultationTypes': doctor.consultationTypes,
                'fees': doctor.fees,
                'isActive': doctor.isActive
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

@medical.route('/doctors/<int:doctor_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required(optional=True)
def delete_doctor(doctor_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        doctor = Doctor.query.get_or_404(doctor_id)
        doctor_info = {
            'id': doctor.id,
            'name': doctor.name,
            'specialty': doctor.specialty
        }
        
        db.session.delete(doctor)
        db.session.commit()
        
        return jsonify({
            'message': 'Doctor deleted successfully',
            'doctor': doctor_info
        }), 200
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500

# Health Metrics Routes
@medical.route('/metrics', methods=['GET'])
@jwt_required()
def get_health_metrics():
    current_user_id = get_jwt_identity()
    metric_type = request.args.get('type')
    
    query = HealthMetric.query.filter_by(patient_id=current_user_id)
    if metric_type:
        query = query.filter_by(metric_type=metric_type)
    
    metrics = query.order_by(HealthMetric.date.desc()).all()
    
    return jsonify([{
        'id': metric.id,
        'metric_type': metric.metric_type,
        'value': metric.value,
        'unit': metric.unit,
        'date': metric.date.isoformat()
    } for metric in metrics]), 200

@medical.route('/metrics', methods=['POST'])
@jwt_required()
def add_health_metric():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    new_metric = HealthMetric(
        patient_id=current_user_id,
        metric_type=data['metric_type'],
        value=data['value'],
        unit=data['unit']
    )

    try:
        db.session.add(new_metric)
        db.session.commit()
        return jsonify({'message': 'Health metric added successfully', 'id': new_metric.id}), 201
    except Exception as e:
        db.session.rollback()
        error_message = str(e)
        if 'unique constraint' in error_message.lower():
            return jsonify({
                'error': 'A doctor with this information already exists',
                'details': error_message
            }), 409
        return jsonify({
            'error': 'Failed to add doctor',
            'details': error_message
        }), 500