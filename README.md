# Dementia Screening & Care System

An end-to-end cognitive screening and patient care platform integrating a Django REST Framework backend with a React (Vite) frontend. The system includes digitized Montreal Cognitive Assessment (MoCA) tests, ML-based speech/audio analysis, and personalized clinical tasks assigned by healthcare professionals.

---

## 🌟 Core Features

### 1. Interactive Cognitive Screening (MoCA)
- **Comprehensive Digitized MoCA**: Covering 10 distinct cognitive fields (visuospatial, naming, memory, attention, language, abstraction, delayed recall, and orientation).
- **Automated Scoring**: Automatically computes sub-scores and total scores.
- **Historical Analysis**: Tracks history of cognitive tests to monitor progression.

### 2. Speech & Audio Signal Processing
- **Audio Recorder**: Record speech responses in-browser.
- **Backend Speech Processing**: Incorporates `librosa` and `numba` to analyze audio files and extract speech biomarkers.
- **ML Predictor**: Runs classification tasks against the pre-trained `dementia_model (1).pkl` to flag potential cognitive impairments.

### 3. Personalised Clinical Plans & Tasks
- **Doctor-Assigned Care Plans**: Doctors can assign customizable schedules (exercise, diet, specific tasks, prescriptions) to patients.
- **Task Tracking**: Patients track daily completion of clinical tasks with structured notes/updates, which are reported back to the doctor.

### 4. Advanced Dashboards
- **Doctor Dashboard**: Provides statistical analytics on patients, logs task completion rates, enables importing of new patient records via medical PDF report extraction (`pypdf`), and manages patient-to-doctor assignments.
- **Patient Dashboard**: Displays latest assessment results, screening history, cognitive tests, and personalized care plan trackers.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Django 4.2+, Django REST Framework (DRF) |
| **Database** | SQLite3 (Default for local setup), MySQL supported |
| **Auth & APIs** | Django Allauth (Social/Google Account integration), JWT & Token-based Auth |
| **ML & Speech Analysis** | Librosa, NumPy, Scikit-Learn, Joblib, Soundfile, Numba |
| **Frontend Setup** | React 19, Vite, React Router DOM 7 |
| **HTTP client** | Axios, Fetch API (with proxy-configured credentials) |

---

## 📁 Project Structure

```text
demintia-screening-system/
├── backend/
│   ├── core/                  # Main Django App (models, views, serializers, migrations)
│   │   ├── ml_predictor.py    # Speech classification using scikit-learn model
│   │   ├── models.py          # Custom User, Patient, Doctor, MOCA, and Clinical Plan schemas
│   │   └── views.py           # Backend controllers for Auth, Dashboards, and Audio Ingestion
│   ├── healthcare/            # Django settings, WSGI/ASGI configurations, and routing
│   ├── db.sqlite3             # Local SQLite database (git-ignored)
│   ├── requirements.txt       # Python backend dependencies
│   ├── debug_plans.py         # DB diagnostics and inspection script
│   └── .env                   # Local credentials and configuration (git-ignored)
├── frontend/
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── assets/            # CSS styles and SVG graphics
│   │   ├── pages/             # Dashboard, Screening, Audio Test, and Login pages
│   │   ├── utils/             # api.js and general configurations
│   │   └── App.jsx            # Frontend routing and entry point
│   ├── package.json           # Node project dependencies
│   └── vite.config.js         # Proxy configuration (/api/* -> http://127.0.0.1:8000)
├── modules/                   # Scoring helper modules
├── .gitignore                 # Root level git ignore template
└── README.md                  # Project documentation (This file)
```

---

## 🚀 Setup & Installation

Follow these steps to set up the project locally on your machine.

### Prerequisites
- **Python 3.12+**
- **Node.js 18+ & npm**

### 1. Backend Configuration
1. Navigate to the root directory:
   ```bash
   cd demintia-screening-system
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Copy the environment variables template:
   ```bash
   cp backend/.env.example backend/.env
   ```
5. Configure `backend/.env` according to your local setup:
   - For a quick local setup, set `DB_ENGINE=django.db.backends.sqlite3` and `DB_NAME=db.sqlite3`.
   - For MySQL, configure `DB_ENGINE=django.db.backends.mysql` along with your database credentials (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`).
6. Apply migrations to initialize the database:
   ```bash
   python backend/manage.py migrate
   ```

### 2. Frontend Configuration
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

Ensure you have activated your virtual environment.

### Step A: Run Backend Server
From the root directory:
```bash
# Windows
venv\Scripts\python.exe backend\manage.py runserver
# Unix/Mac
python backend/manage.py runserver
```
The Django server starts at **`http://127.0.0.1:8000`**.

### Step B: Run Frontend Server
From the `frontend/` directory:
```bash
npm run dev
```
The Vite development server starts at **`http://localhost:3000`**. 

Vite is pre-configured to proxy API calls: `/api/*` requests will automatically route to the backend server.

---

## 🧪 Verification & Diagnostics

To check the database connection and print current counts of Patients, Doctors, and Clinical Plans, run the inspection script:
```bash
# Windows
venv\Scripts\python.exe backend/debug_plans.py
# Unix/Mac
python backend/debug_plans.py
```
