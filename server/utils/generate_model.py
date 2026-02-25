import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import os

# Create dummy training data
# Features: pause_duration, speech_rate (words/min), word_count, reaction_time (s), quiz_score (%)
# Target: 0=Low, 1=Moderate, 2=High
X = np.array([
    [2.0, 120.0, 60, 0.8, 95], # Healthy: Low pause, high rate, high score
    [1.5, 130.0, 65, 0.7, 100],# Healthy: Very low pause, high score
    [15.0, 40.0, 20, 3.5, 30], # High Risk: High pause, low rate, low score
    [12.0, 50.0, 25, 3.0, 45], # High Risk: Many pauses, slow speech
    [6.0, 80.0, 40, 1.5, 75],  # Moderate: Middle values
    [7.0, 70.0, 35, 1.8, 60]   # Moderate: Mild drift indicators
])

y = np.array([0, 0, 2, 2, 1, 1])

# Train model
model = RandomForestClassifier(n_estimators=50, random_state=42)
model.fit(X, y)

# Save model
model_path = os.path.join('server', 'model', 'dementia_model.pkl')
os.makedirs(os.path.dirname(model_path), exist_ok=True)

with open(model_path, 'wb') as f:
    pickle.dump(model, f)

print(f"Model saved to {model_path}")
