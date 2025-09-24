# Healthcare Platform Backend

This is the backend server for the Healthcare Platform, built with Flask and SQLAlchemy.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Update the variables as needed

4. Initialize the database:
```bash
python server.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new patient
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/profile` - Get patient profile
- `PUT /api/auth/profile` - Update patient profile

### Medical Records
- `GET /api/medical/records` - Get patient's medical records
- `POST /api/medical/records` - Add a new medical record

### Appointments
- `GET /api/medical/appointments` - Get patient's appointments
- `POST /api/medical/appointments` - Schedule a new appointment
- `PUT /api/medical/appointments/<id>` - Update appointment status

### Prescriptions
- `GET /api/medical/prescriptions` - Get patient's prescriptions
- `POST /api/medical/prescriptions` - Add a new prescription

### Health Metrics
- `GET /api/medical/metrics` - Get patient's health metrics
- `POST /api/medical/metrics` - Add new health metrics

### Emergency Services
- `POST /api/emergency/activate` - Activate emergency detection
- `POST /api/emergency/deactivate` - Deactivate emergency detection
- `GET /api/emergency/status` - Get emergency detection status
- `POST /api/emergency/alert` - Trigger emergency alert
- `GET /api/emergency/contacts` - Get emergency contact information
- `POST /api/emergency/monitor/vitals` - Monitor vital signs

## Database Models

### Patient
- Basic information (name, email, etc.)
- Medical history
- Emergency contacts
- Authentication details

### Medical Record
- Date and time
- Doctor information
- Diagnosis
- Notes

### Appointment
- Date and time
- Doctor information
- Type (in-person/teleconsultation)
- Status

### Prescription
- Medication details
- Dosage information
- Start/End dates
- Refill status

### Health Metric
- Type of metric
- Value and unit
- Timestamp

## Security

- JWT-based authentication
- Password hashing
- CORS protection
- Input validation
- Error handling

## Development

1. Start the development server:
```bash
python server.py
```

2. The server will run at `http://localhost:5000`

## Testing

To run tests:
```bash
python -m pytest tests/
```

## Production Deployment

1. Update `.env` with production settings
2. Set `FLASK_ENV=production`
3. Use a production-grade server (e.g., Gunicorn)
4. Set up proper database (e.g., PostgreSQL)
5. Configure proper logging
6. Set up SSL/TLS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request