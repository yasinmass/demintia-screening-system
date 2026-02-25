from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
MODEL_PATH = os.path.join("model", "dementia_model.pkl")

class PredictionRequest(BaseModel):
    pause_duration: float
    speech_rate: float
    word_count: int
    reaction_time: float
    quiz_score: float

@app.on_event("startup")
def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Error: Model not found at {MODEL_PATH}")
        return
    with open(MODEL_PATH, "rb") as f:
        app.state.model = pickle.load(f)

@app.post("/predict")
async def predict(request: PredictionRequest):
    if not hasattr(app.state, "model"):
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Prepare features
    features = np.array([[
        request.pause_duration,
        request.speech_rate,
        request.word_count,
        request.reaction_time,
        request.quiz_score
    ]])
    
    # Predict
    prob = app.state.model.predict_proba(features)[0]
    risk_idx = np.argmax(prob)
    levels = ["Low", "Moderate", "High"]
    
    return {
        "risk_probability": float(np.max(prob)),
        "risk_level": levels[risk_idx]
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
