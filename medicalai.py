# =============================================================================
# CARDIAC ARREST PREDICTION SYSTEM - VERSION 4
# Model now predicts clinical phase directly
# =============================================================================

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
import warnings
import joblib
from datetime import datetime
import time
import random
import os
from IPython.display import clear_output

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)
warnings.filterwarnings('ignore')

# Set up plotting
plt.style.use('default')
sns.set_palette("husl")

print("✅ Libraries imported successfully!")
print("🏥 Cardiac Arrest Prediction System Ready")

# =============================================================================
# DATASET AND MODEL SETUP (INITIALIZATION)
# =============================================================================

def generate_cardiac_dataset(n_patients=200, filepath='clinical_scale_cardiac_event_dataset_no_sensitive.csv'):
    """
    Generate synthetic patient data with explicit physiological phases and save it.
    This function is now smart enough to check if an existing file is compatible.
    """
    if os.path.exists(filepath):
        try:
            df = pd.read_csv(filepath)
            if 'physiological_phase' in df.columns:
                print(f"✅ Found compatible dataset at '{filepath}'. Skipping generation.")
                return df
            else:
                print(f"⚠️ Found an old dataset file at '{filepath}'. It is not compatible with this version.")
                print("🔄 Deleting old file and generating a new, compatible dataset...")
                os.remove(filepath)
        except Exception as e:
            print(f"Error reading dataset file: {e}")
            print("🔄 Generating a new dataset...")
    
    print(f"🔄 Generating synthetic dataset for {n_patients} patients...")
    
    data = []
    for patient_id in range(n_patients):
        # 70% normal, 30% cardiac arrest risk
        is_cardiac_event = np.random.choice([0, 1], p=[0.7, 0.3])
        age = max(18, min(95, np.random.normal(65, 15)))
        gender = np.random.choice([0, 1])
        
        physiological_phase = 'normal'
        
        if is_cardiac_event == 0:
            heart_rate = np.random.normal(75, 10)
            respiratory_rate = np.random.normal(16, 3)
            systolic_bp = np.random.normal(120, 15)
            diastolic_bp = np.random.normal(80, 10)
            oxygen_saturation = np.random.normal(98, 1.5)
            body_temperature = np.random.normal(98.6, 0.8)
            hr_trend_1h = np.random.normal(0, 2)
            hr_trend_6h = np.random.normal(0, 3)
            rr_trend_1h = np.random.normal(0, 1)
            rr_trend_6h = np.random.normal(0, 1.5)
            bp_trend_1h = np.random.normal(0, 3)
            bp_trend_6h = np.random.normal(0, 5)
            spo2_trend_1h = np.random.normal(0, 0.5)
            spo2_trend_6h = np.random.normal(0, 1)
            hr_variability = np.random.normal(5, 2)
            bp_variability = np.random.normal(8, 3)
            compensatory_index = np.random.normal(0.2, 0.1)
        else:
            phase_choice = np.random.choice(['compensatory', 'decompensatory'], p=[0.6, 0.4])
            physiological_phase = phase_choice
            
            if phase_choice == 'compensatory':
                heart_rate = np.random.normal(95, 15)
                respiratory_rate = np.random.normal(22, 4)
                systolic_bp = np.random.normal(135, 20)
                diastolic_bp = np.random.normal(85, 12)
                oxygen_saturation = np.random.normal(94, 3)
                body_temperature = np.random.normal(98.2, 1.2)
                hr_trend_1h = np.random.normal(8, 4)
                hr_trend_6h = np.random.normal(15, 8)
                rr_trend_1h = np.random.normal(3, 2)
                rr_trend_6h = np.random.normal(6, 3)
                bp_trend_1h = np.random.normal(5, 8)
                bp_trend_6h = np.random.normal(8, 12)
                spo2_trend_1h = np.random.normal(-1, 1)
                spo2_trend_6h = np.random.normal(-2.5, 2)
                hr_variability = np.random.normal(12, 4)
                bp_variability = np.random.normal(18, 6)
                compensatory_index = np.random.normal(0.7, 0.15)
            else: # decompensatory
                heart_rate = np.random.normal(110, 20)
                respiratory_rate = np.random.normal(28, 6)
                systolic_bp = np.random.normal(95, 25)
                diastolic_bp = np.random.normal(65, 15)
                oxygen_saturation = np.random.normal(88, 5)
                body_temperature = np.random.normal(97.5, 1.5)
                hr_trend_1h = np.random.normal(12, 8)
                hr_trend_6h = np.random.normal(25, 15)
                rr_trend_1h = np.random.normal(6, 4)
                rr_trend_6h = np.random.normal(12, 6)
                bp_trend_1h = np.random.normal(-8, 12)
                bp_trend_6h = np.random.normal(-15, 18)
                spo2_trend_1h = np.random.normal(-3, 2)
                spo2_trend_6h = np.random.normal(-6, 4)
                hr_variability = np.random.normal(20, 8)
                bp_variability = np.random.normal(25, 10)
                compensatory_index = np.random.normal(0.9, 0.1)

        heart_rate = max(40, min(180, heart_rate))
        respiratory_rate = max(8, min(40, respiratory_rate))
        systolic_bp = max(70, min(200, systolic_bp))
        diastolic_bp = max(40, min(120, diastolic_bp))
        oxygen_saturation = max(70, min(100, oxygen_saturation))
        body_temperature = max(95, min(104, body_temperature))
        compensatory_index = max(0, min(1, compensatory_index))
        
        data.append([
            patient_id, heart_rate, respiratory_rate, systolic_bp, diastolic_bp,
            oxygen_saturation, body_temperature, age, gender,
            hr_trend_1h, hr_trend_6h, rr_trend_1h, rr_trend_6h,
            bp_trend_1h, bp_trend_6h, spo2_trend_1h, spo2_trend_6h,
            hr_variability, bp_variability, compensatory_index, physiological_phase
        ])
    
    columns = [
        'patient_id', 'heart_rate', 'respiratory_rate', 'systolic_bp', 'diastolic_bp',
        'oxygen_saturation', 'body_temperature', 'age', 'gender',
        'hr_trend_1h', 'hr_trend_6h', 'rr_trend_1h', 'rr_trend_6h',
        'bp_trend_1h', 'bp_trend_6h', 'spo2_trend_1h', 'spo2_trend_6h',
        'hr_variability', 'bp_variability', 'compensatory_index', 'physiological_phase'
    ]
    
    df = pd.DataFrame(data, columns=columns)
    df.to_csv(filepath, index=False)
    
    print(f"✅ Dataset created and saved as '{filepath}' with {len(df)} patients")
    return df

class CardiacDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.feature_names = [
            'heart_rate', 'respiratory_rate', 'systolic_bp', 'diastolic_bp',
            'oxygen_saturation', 'body_temperature', 'age', 'gender',
            'hr_trend_1h', 'hr_trend_6h', 'rr_trend_1h', 'rr_trend_6h',
            'bp_trend_1h', 'bp_trend_6h', 'spo2_trend_1h', 'spo2_trend_6h',
            'hr_variability', 'bp_variability', 'compensatory_index'
        ]
        self.phase_map = {'normal': 0, 'compensatory': 1, 'decompensatory': 2}
        self.inverse_phase_map = {0: 'normal', 1: 'compensatory', 2: 'decompensatory'}
        
    def preprocess(self, df):
        print("🔄 Preprocessing data...")
        X = df[self.feature_names].copy()
        # Convert categorical labels to numerical for the model
        y = df['physiological_phase'].map(self.phase_map).copy()
        X_imputed = pd.DataFrame(self.imputer.fit_transform(X), columns=self.feature_names)
        X_scaled = pd.DataFrame(self.scaler.fit_transform(X_imputed), columns=self.feature_names)
        print("✅ Data preprocessing completed")
        return X_scaled, y

def train_cardiac_models(X, y):
    print("🤖 Training cardiac arrest prediction models...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000)
    }
    best_model = None
    best_score = 0
    best_model_name = ""
    for name, model in models.items():
        print(f"\n🔄 Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        if accuracy > best_score:
            best_score = accuracy
            best_model = model
            best_model_name = name
            
        print(f"✅ {name}: Test Accuracy: {accuracy:.3f}")
        
    print(f"\n🏆 Best model: {best_model_name} (Test Accuracy: {best_score:.3f})")
    return best_model, best_model_name

# =============================================================================
# REAL-TIME PREDICTION AND ANALYSIS FUNCTIONS
# =============================================================================

def predict_patient_phase(patient_data, model, scaler, feature_names):
    """Predict the clinical phase for a patient based on the trained model"""
    patient_df = pd.DataFrame([patient_data])
    required_features = feature_names
    missing_features = set(required_features) - set(patient_df.columns)
    if missing_features:
        raise ValueError(f"Missing features: {missing_features}")
    
    patient_scaled = scaler.transform(patient_df[required_features])
    
    # Predict the numerical phase (0, 1, or 2)
    predicted_phase_num = model.predict(patient_scaled)[0]
    
    # Map the numerical prediction back to a clinical phase
    preprocessor = CardiacDataPreprocessor()
    predicted_phase_str = preprocessor.inverse_phase_map[predicted_phase_num]
    
    return predicted_phase_str, {
        'normal': 'LOW',
        'compensatory': 'MEDIUM',
        'decompensatory': 'HIGH'
    }[predicted_phase_str]

def create_patient_report(patient_data, predicted_phase_str, risk_level):
    """Generate a comprehensive patient report based on the predicted phase"""
    alerts = []
    recommendations = []
    
    if predicted_phase_str == 'decompensatory':
        alerts.append("🚨 CRITICAL: Decompensatory phase detected. Body systems failing.")
        recommendations.append("Immediate physician evaluation required")
        recommendations.append("Activate rapid response team")
    elif predicted_phase_str == 'compensatory':
        alerts.append("⚠️ HIGH RISK: Compensatory phase detected. Patient is under stress.")
        recommendations.append("Increase monitoring frequency to every 15 minutes")
        recommendations.append("Notify attending physician immediately")
    else:
        alerts.append("🟢 NORMAL: Patient vitals are stable.")
        recommendations.append("Continue routine monitoring")

    report = f"""
🏥 CARDIAC ARREST RISK ASSESSMENT REPORT
{'='*50}
📅 Timestamp: {datetime.now().isoformat()}
🆔 Patient ID: Real-time Patient

📊 RISK ASSESSMENT
Predicted Phase: {predicted_phase_str.upper()}
Risk Level: {risk_level}

💓 CURRENT VITAL SIGNS
Heart Rate: {patient_data.get('heart_rate', 'N/A')} bpm
Respiratory Rate: {patient_data.get('respiratory_rate', 'N/A')} /min
Blood Pressure: {patient_data.get('systolic_bp', 'N/A')}/{patient_data.get('diastolic_bp', 'N/A')} mmHg
Oxygen Saturation: {patient_data.get('oxygen_saturation', 'N/A')}%
Body Temperature: {patient_data.get('body_temperature', 'N/A')}°F

🚨 ALERTS
"""
    for alert in alerts: report += f"• {alert}\n"
    report += f"""
💡 RECOMMENDATIONS
"""
    for rec in recommendations: report += f"• {rec}\n"
    report += "="*50
    return report

def get_real_time_input(mode='simulated'):
    """Get patient vital signs either manually or from a simulation"""
    # This function remains largely the same, but trend calculation is now more important
    # to feed the new model.
    if mode == 'manual':
        print("\n📥 Enter patient vital signs manually:")
        try:
            patient_data = {
                'heart_rate': float(input("Heart Rate (bpm): ")),
                'respiratory_rate': float(input("Respiratory Rate (breaths/min): ")),
                'systolic_bp': float(input("Systolic BP (mmHg): ")),
                'diastolic_bp': float(input("Diastolic BP (mmHg): ")),
                'oxygen_saturation': float(input("Oxygen Saturation (%): ")),
                'body_temperature': float(input("Body Temperature (°F): ")),
                'age': float(input("Age: ")),
                'gender': float(input("Gender (0=F, 1=M): ")),
                'hr_trend_1h': float(input("HR trend (1hr): ")),
                'hr_trend_6h': float(input("HR trend (6hr): ")),
                'rr_trend_1h': float(input("RR trend (1hr): ")),
                'rr_trend_6h': float(input("RR trend (6hr): ")),
                'bp_trend_1h': float(input("BP trend (1hr): ")),
                'bp_trend_6h': float(input("BP trend (6hr): ")),
                'spo2_trend_1h': float(input("SpO2 trend (1hr): ")),
                'spo2_trend_6h': float(input("SpO2 trend (6hr): ")),
                'hr_variability': float(input("Heart Rate variability: ")),
                'bp_variability': float(input("Blood Pressure variability: ")),
                'compensatory_index': float(input("Compensatory index (0-1): "))
            }
            return patient_data
        except ValueError:
            print("Invalid input. Please enter numbers.")
            return None
    
    elif mode == 'simulated':
        global simulation_time
        deterioration_factor = simulation_time / (36 * 60)
        
        heart_rate = 75 + (deterioration_factor * 50) + np.random.normal(0, 5)
        respiratory_rate = 16 + (deterioration_factor * 15) + np.random.normal(0, 2)
        systolic_bp = 120 - (deterioration_factor * 40) + np.random.normal(0, 8)
        diastolic_bp = 80 - (deterioration_factor * 20) + np.random.normal(0, 5)
        oxygen_saturation = 98 - (deterioration_factor * 10) + np.random.normal(0, 1)
        body_temperature = 98.6 - (deterioration_factor * 1.5) + np.random.normal(0, 0.3)
        
        # Calculate trends based on last 6 hours of simulated data
        if len(real_time_vitals) >= 24:
            df_trends = pd.DataFrame(real_time_vitals)
            hr_trend_6h = df_trends['heart_rate'].iloc[-1] - df_trends['heart_rate'].iloc[-24]
            bp_trend_6h = df_trends['systolic_bp'].iloc[-1] - df_trends['systolic_bp'].iloc[-24]
            spo2_trend_6h = df_trends['oxygen_saturation'].iloc[-1] - df_trends['oxygen_saturation'].iloc[-24]
        else:
            hr_trend_6h, bp_trend_6h, spo2_trend_6h = 0, 0, 0
        
        patient_data = {
            'heart_rate': max(50, min(150, heart_rate)),
            'respiratory_rate': max(10, min(30, respiratory_rate)),
            'systolic_bp': max(70, min(180, systolic_bp)),
            'diastolic_bp': max(50, min(110, diastolic_bp)),
            'oxygen_saturation': max(75, min(100, oxygen_saturation)),
            'body_temperature': max(96.0, min(100.0, body_temperature)),
            'age': 65, 'gender': 1,
            'hr_trend_1h': 5, 'hr_trend_6h': hr_trend_6h,
            'rr_trend_1h': 2, 'rr_trend_6h': 5,
            'bp_trend_1h': -5, 'bp_trend_6h': bp_trend_6h,
            'spo2_trend_1h': -2, 'spo2_trend_6h': spo2_trend_6h,
            'hr_variability': np.random.normal(12, 4),
            'bp_variability': np.random.normal(18, 6),
            'compensatory_index': deterioration_factor
        }
        return patient_data

def plot_trends(data_df):
    """Generates a trend graph from the collected data"""
    if data_df.empty: return
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Real-time Patient Vitals Trends', fontsize=16)

    data_df['timestamp'] = pd.to_datetime(data_df['timestamp'])
    
    axes[0, 0].plot(data_df['timestamp'], data_df['heart_rate'], 'r-o', label='Heart Rate (bpm)')
    axes[0, 0].set_title('Heart Rate Trend')
    axes[0, 0].set_ylabel('BPM')
    axes[0, 0].grid(True)
    axes[0, 0].tick_params(axis='x', rotation=45)

    axes[0, 1].plot(data_df['timestamp'], data_df['respiratory_rate'], 'b-o', label='Respiratory Rate (/min)')
    axes[0, 1].set_title('Respiratory Rate Trend')
    axes[0, 1].set_ylabel('Breaths/min')
    axes[0, 1].grid(True)
    axes[0, 1].tick_params(axis='x', rotation=45)

    axes[1, 0].plot(data_df['timestamp'], data_df['systolic_bp'], 'g-o', label='Systolic BP (mmHg)')
    axes[1, 0].plot(data_df['timestamp'], data_df['diastolic_bp'], 'g--o', label='Diastolic BP (mmHg)')
    axes[1, 0].set_title('Blood Pressure Trend')
    axes[1, 0].set_ylabel('mmHg')
    axes[1, 0].grid(True)
    axes[1, 0].tick_params(axis='x', rotation=45)
    axes[1, 0].legend()

    axes[1, 1].plot(data_df['timestamp'], data_df['oxygen_saturation'], 'm-o', label='SpO2 (%)')
    axes[1, 1].set_title('Oxygen Saturation Trend')
    axes[1, 1].set_ylabel('Percentage')
    axes[1, 1].grid(True)
    axes[1, 1].tick_params(axis='x', rotation=45)

    plt.tight_layout()
    plt.show()

# =============================================================================
# MAIN EXECUTION LOOP
# =============================================================================

if __name__ == "__main__":
    # --- Step 1: Initialize System ---
    df_train = generate_cardiac_dataset(200)
    preprocessor = CardiacDataPreprocessor()
    X_train, y_train = preprocessor.preprocess(df_train)
    best_model, best_model_name = train_cardiac_models(X_train, y_train)

    # --- Step 2: Start Real-Time Monitoring ---
    real_time_vitals = []
    start_time = datetime.now()
    simulation_time = 0 # In minutes
    interval_minutes = 15
    analysis_interval_minutes = 120 # 2 hours
    analysis_interval_readings = analysis_interval_minutes // interval_minutes
    reset_interval_minutes = 36 * 60 # 36 hours

    print("\nStarting real-time monitoring simulation.")
    mode = input("Choose mode ('manual' or 'simulated'): ").strip().lower()

    try:
        while True:
            # Check for 36-hour reset
            current_time = datetime.now()
            if (current_time - start_time).total_seconds() / 60 >= reset_interval_minutes:
                print("\n--- 🔄 36-HOUR CYCLE COMPLETE. SYSTEM RESETTING. 🔄 ---")
                real_time_vitals = []
                start_time = current_time
                simulation_time = 0
                time.sleep(3) # Pause for effect
                
            # Get new vital signs data
            new_vitals = get_real_time_input(mode)
            if new_vitals:
                new_vitals['timestamp'] = current_time.isoformat()
                real_time_vitals.append(new_vitals)

            simulation_time += interval_minutes
            
            clear_output(wait=True)
            print(f"--- 🏥 REAL-TIME CARDIAC MONITORING ---")
            print(f"Time Elapsed: {simulation_time // 60:02d}h {simulation_time % 60:02d}m")
            print(f"Current Vitals: HR={new_vitals['heart_rate']:.1f}, BP={new_vitals['systolic_bp']:.1f}/{new_vitals['diastolic_bp']:.1f}, SpO2={new_vitals['oxygen_saturation']:.1f}%")
            
            # Perform analysis every 2-3 hours
            if len(real_time_vitals) >= analysis_interval_readings:
                print("\n--- 📈 ANALYZING PATTERN DATA... 📈 ---")
                
                collected_data_df = pd.DataFrame(real_time_vitals)
                latest_vitals = collected_data_df.iloc[-1].to_dict()
                
                # Use the new function to get phase and risk level
                predicted_phase_str, risk_level = predict_patient_phase(latest_vitals, best_model, preprocessor.scaler, preprocessor.feature_names)
                report = create_patient_report(latest_vitals, predicted_phase_str, risk_level)
                
                print(report)
                
                plot_trends(collected_data_df)
                
                if risk_level == 'HIGH':
                    print("🚨🚨🚨 ATTENTION: A HIGH-RISK PATTERN HAS BEEN IDENTIFIED. IMMEDIATE ACTION REQUIRED. 🚨🚨🚨")
                elif risk_level == 'MEDIUM':
                    print("⚠️ CAUTION: VITAL SIGNS ARE SHOWING A COMPENSATORY RESPONSE. INCREASE MONITORING. ⚠️")

            print(f"\nNext reading in {interval_minutes} minutes...")
            time.sleep(1) # Simulated wait time.
            
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
